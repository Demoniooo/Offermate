/* ============================================================
   OfferMate · 诊断接口（D4–D5）
   POST /api/diagnose  { resume, jd?, lang? }  ->  DiagnosisReport
   调 LLM（NanoGPT / OpenAI 兼容），按 lib/rubric.ts 的 rubric 打分。
   ============================================================ */

import { NextResponse } from "next/server";
import { buildDiagnosisMessages, DIMENSION_LABELS } from "@/lib/prompts";
import { clientIp, rateLimit, type RateRule } from "@/lib/ratelimit";
import type { DiagnosisReport } from "@/lib/types";
import type { Lang } from "@/lib/rubric";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RESUME = 6000;
const RATE: RateRule = { windowMs: 60_000, max: 20 }; // 订阅制不计 token，宽松设限：仅防脚本/失控刷量（每 IP 每分钟 20 次）

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
    r.rewrites.length >= 1 &&
    r.rewrites.every((w: any) => w && isStr(w.before) && isStr(w.after) && Array.isArray(w.issues) && Array.isArray(w.wins)) &&
    r.jd_match &&
    isNum(r.jd_match.overall) &&
    isStr(r.jd_match.recommendation) &&
    Array.isArray(r.jd_match.buckets) &&
    r.jd_match.buckets.length >= 1 &&
    r.jd_match.buckets.every((b: any) => b && isStr(b.title) && isNum(b.hits) && isNum(b.total) && Array.isArray(b.items))
    // next_steps 不再校验：它是静态 CTA，由服务端拼装（见 finalize），不信任模型
  );
}

/** 五维 label 是否为本语言的固定标签且顺序一致（雷达图按数组序贴固定坐标，乱序/改名会画歪） */
function dimsOrdered(r: any, lang: Lang): boolean {
  const want = DIMENSION_LABELS[lang];
  const norm = (s: unknown) => String(s).replace(/\s+/g, "");
  return (
    Array.isArray(r?.dimensions) &&
    r.dimensions.length === 5 &&
    r.dimensions.every((d: any, i: number) => norm(d?.label) === norm(want[i]))
  );
}

/** 达到提示词约定的完整规格：5 维标签正序、≥3 条发现、≥1 条改写、恰好 3 个 JD 桶 */
function isComplete(r: any, lang: Lang): boolean {
  return structOk(r) && dimsOrdered(r, lang) && r.findings.length >= 3 && r.rewrites.length >= 1 && r.jd_match.buckets.length === 3;
}

const NEXT_STEPS: Record<Lang, { title: string; subtitle: string }> = {
  zh: { title: "改完简历，来一场针对性模拟面试", subtitle: "按目标岗位出题、追问 2-3 层，给一份和诊断同样格式、可对比的复盘报告。" },
  en: { title: "Fix the resume, then run a targeted mock interview", subtitle: "Role-specific questions with 2-3 follow-up layers, ending in a comparable debrief." },
};

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** 收尾：分数 clamp 到 0-100；next_steps 服务端拼装（静态 CTA，不依赖模型） */
function finalize(r: DiagnosisReport, lang: Lang): DiagnosisReport {
  r.overall_score = clamp100(r.overall_score);
  for (const d of r.dimensions) d.score = clamp100(d.score);
  r.next_steps = NEXT_STEPS[lang];
  return r;
}

async function callLLM(messages: { role: string; content: string }[], clientSignal?: AbortSignal): Promise<string> {
  const base = process.env.LLM_BASE_URL;
  const key = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!base || !key || !model) throw new Error("LLM env not configured");

  // 每次调用 25s 预算：两次 + 解析开销 < 60s（Vercel maxDuration），保证错误兜底有机会执行。
  // 同时接住客户端取消信号：用户在前端 abort 时，上游模型调用真的被掐断，不再白烧 token。
  const timeout = AbortSignal.timeout(25_000);
  const signal = clientSignal ? AbortSignal.any([timeout, clientSignal]) : timeout;

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
    signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`LLM ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const choice = data?.choices?.[0];
  const content: string = choice?.message?.content ?? "";
  console.log(`[diagnose] finish=${choice?.finish_reason} len=${content.length} out_tokens=${data?.usage?.completion_tokens}`);
  return content;
}

export async function POST(req: Request) {
  // 限流前置：先挡住刷量，再谈解析与调模型（防匿名刷爆付费网关预算）
  const rl = rateLimit(`diagnose:${clientIp(req)}`, RATE);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

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

  // 配置缺失是不可重试的内部错误：前置检查，缺则直接 500，不陪跑循环、不泄露细节
  if (!process.env.LLM_API_KEY || !process.env.LLM_BASE_URL || !process.env.LLM_MODEL) {
    console.error("[diagnose] LLM env not configured");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const messages = buildDiagnosisMessages(resume, jd, lang);

  // 最多两次：完整即返回；只是「可渲染但不够完整」则留作兜底，再试一次拿更完整的
  let fallback: DiagnosisReport | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const content = await callLLM(messages, req.signal);
      const report = parseReport(content);
      if (isComplete(report, lang)) return NextResponse.json(finalize(report as DiagnosisReport, lang));
      if (structOk(report) && !fallback) fallback = report;
    } catch (e) {
      // 错误细节只留服务端日志，绝不透传给客户端（可能含供应商/配额/账号信息）
      console.error(`[diagnose] attempt ${attempt} failed:`, e instanceof Error ? e.message : e);
      if (attempt === 1 && !fallback) {
        return NextResponse.json({ error: "llm_error" }, { status: 502 });
      }
    }
  }
  if (fallback) return NextResponse.json(finalize(fallback, lang));
  // 两次都没拿到合规报告（如模型只吐了空 findings / 结构残缺）
  return NextResponse.json({ error: "incomplete_report" }, { status: 502 });
}
