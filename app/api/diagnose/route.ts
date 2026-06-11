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

  // 最多两次：首发 + 解析失败重试 1 次
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const content = await callLLM(messages);
      const report = parseReport(content);
      if (report && typeof report.overall_score === "number" && Array.isArray(report.findings)) {
        return NextResponse.json(report);
      }
    } catch (e) {
      if (attempt === 1) {
        const msg = e instanceof Error ? e.message : "unknown";
        return NextResponse.json({ error: "llm_error", detail: msg }, { status: 502 });
      }
    }
  }
  return NextResponse.json({ error: "parse_failed" }, { status: 502 });
}
