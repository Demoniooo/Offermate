/* ============================================================
   OfferMate · 诊断接口（D4–D5）
   POST /api/diagnose  { resume, jd?, lang? }  ->  DiagnosisReport
   调 LLM（NanoGPT / OpenAI 兼容），按 lib/rubric.ts 的 rubric 打分。
   ============================================================ */

import { NextResponse } from "next/server";
import { buildDiagnosisMessages } from "@/lib/prompts";
import type { DiagnosisReport } from "@/lib/types";
import type { Lang } from "@/lib/rubric";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RESUME = 6000;

/** 容错解析：去掉可能的代码块/前后缀，提取最外层 {...} */
function parseReport(content: string): DiagnosisReport | null {
  const tryParse = (s: string): DiagnosisReport | null => {
    try {
      return JSON.parse(s) as DiagnosisReport;
    } catch {
      return null;
    }
  };
  let r = tryParse(content);
  if (r) return r;
  const cleaned = content.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  r = tryParse(cleaned);
  if (r) return r;
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) r = tryParse(cleaned.slice(start, end + 1));
  return r;
}

const isStr = (x: unknown) => typeof x === "string" && x.length > 0;
const isNum = (x: unknown) => typeof x === "number";

/** 结构完整、且前端不会崩、且有最少内容（≥1 条发现）——可渲染的底线 */
function structOk(r: any): boolean {
  return (
    !!r &&
    isNum(r.overall_score) &&
    isStr(r.level_tag) &&
    isStr(r.summary) &&
    Array.isArray(r.dimensions) &&
    r.dimensions.length === 5 &&
    r.dimensions.every((d: any) => d && isStr(d.label) && isNum(d.score)) &&
    r.kpi &&
    isNum(r.kpi.findings_count) &&
    isNum(r.kpi.rewrites_count) &&
    Array.isArray(r.findings) &&
    r.findings.length >= 1 &&
    r.findings.every(
      (f: any) =>
        f && isStr(f.severity) && isStr(f.dimension) && isStr(f.basis) && isStr(f.title) && isStr(f.body) && isStr(f.suggestion)
    ) &&
    Array.isArray(r.rewrites) &&
    r.rewrites.every((w: any) => w && isStr(w.before) && isStr(w.after) && Array.isArray(w.issues) && Array.isArray(w.wins)) &&
    r.jd_match &&
    isNum(r.jd_match.overall) &&
    isStr(r.jd_match.recommendation) &&
    Array.isArray(r.jd_match.buckets) &&
    r.jd_match.buckets.length >= 1 &&
    r.jd_match.buckets.every((b: any) => b && isStr(b.title) && Array.isArray(b.items)) &&
    r.next_steps &&
    isStr(r.next_steps.title) &&
    isStr(r.next_steps.subtitle)
  );
}

/** 达到提示词约定的完整规格：≥3 条发现、恰好 3 个 JD 桶 */
function isComplete(r: any): boolean {
  return structOk(r) && r.findings.length >= 3 && r.jd_match.buckets.length === 3;
}

async function callLLM(messages: { role: string; content: string }[]): Promise<string> {
  const base = process.env.LLM_BASE_URL;
  const key = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!base || !key || !model) throw new Error("LLM env not configured");

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`LLM ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const choice = data?.choices?.[0];
  const content: string = choice?.message?.content ?? "";
  console.error(`[diagnose] finish=${choice?.finish_reason} len=${content.length} out_tokens=${data?.usage?.completion_tokens}`);
  return content;
}

export async function POST(req: Request) {
  let body: { resume?: string; jd?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const resume = (body.resume ?? "").slice(0, MAX_RESUME);
  const jd = body.jd?.slice(0, MAX_RESUME);
  const lang: Lang = body.lang === "en" ? "en" : "zh";

  if (!resume.trim()) {
    return NextResponse.json({ error: "empty_resume" }, { status: 400 });
  }

  const messages = buildDiagnosisMessages(resume, jd, lang);

  // 最多两次：完整即返回；只是「可渲染但不够完整」则留作兜底，再试一次拿更完整的
  let fallback: DiagnosisReport | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const content = await callLLM(messages);
      const report = parseReport(content);
      if (isComplete(report)) return NextResponse.json(report);
      if (structOk(report) && !fallback) fallback = report;
    } catch (e) {
      if (attempt === 1 && !fallback) {
        const msg = e instanceof Error ? e.message : "unknown";
        return NextResponse.json({ error: "llm_error", detail: msg }, { status: 502 });
      }
    }
  }
  if (fallback) return NextResponse.json(fallback);
  // 两次都没拿到合规报告（如模型只吐了空 findings / 结构残缺）
  return NextResponse.json({ error: "incomplete_report" }, { status: 502 });
}
