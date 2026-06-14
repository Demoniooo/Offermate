/* ============================================================
   OfferMate · 面试开场准备（联网研究 JD）
   POST /api/interview/prepare  { resume, jd?, lang? }  ->  { brief }
   开场时调一次：用 NanoGPT 的联网搜索（webSearch.enabled）检索公司/岗位实情，
   产出一份「岗位研究简报」。前端缓存后随每轮 /api/interview 回传。
   研究失败不阻断面试——返回空简报，面试退回纯 JD 出题。
   ============================================================ */

import { NextResponse } from "next/server";
import { buildResearchMessages, MAX_BRIEF } from "@/lib/jd-research";
import { clientIp, rateLimit, type RateRule } from "@/lib/ratelimit";
import type { Lang } from "@/lib/rubric";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RESUME = 6000;
// 联网搜索每次面试只调一次；订阅制不计 token，宽松设限：仅防脚本/失控刷量（每 IP 每分钟 20 次）
const RATE: RateRule = { windowMs: 60_000, max: 20 };

/** 带联网搜索的一次调用：webSearch 结果内联进正文，返回纯文本简报 */
async function research(messages: { role: string; content: string }[], clientSignal?: AbortSignal): Promise<string> {
  const base = process.env.LLM_BASE_URL;
  const key = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!base || !key || !model) throw new Error("LLM env not configured");

  // 联网检索更慢，给 35s；仍 < 60s maxDuration，留出兜底空间。接住客户端取消。
  const timeout = AbortSignal.timeout(35_000);
  const signal = clientSignal ? AbortSignal.any([timeout, clientSignal]) : timeout;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 1200,
      // NanoGPT 联网搜索：对象式开关（官方推荐），结果内联进回答。provider/depth 可后续调优。
      webSearch: { enabled: true },
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
  console.log(`[prepare] finish=${choice?.finish_reason} len=${content.length} out_tokens=${data?.usage?.completion_tokens}`);
  return content;
}

export async function POST(req: Request) {
  // 限流前置：联网搜索最贵，先挡刷量
  const rl = rateLimit(`prepare:${clientIp(req)}`, RATE);
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

  // 配置缺失不可重试：前置 500，不泄露细节
  if (!process.env.LLM_API_KEY || !process.env.LLM_BASE_URL || !process.env.LLM_MODEL) {
    console.error("[prepare] LLM env not configured");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  try {
    const content = await research(buildResearchMessages(resume, jd, lang), req.signal);
    const brief = content.trim().slice(0, MAX_BRIEF);
    return NextResponse.json({ brief });
  } catch (e) {
    // 研究失败不阻断面试：空简报，前端照常开场（仅基于 JD）。细节只留服务端日志。
    console.error("[prepare] research failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ brief: "" });
  }
}
