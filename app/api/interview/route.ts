/* ============================================================
   OfferMate · 模拟面试接口（D10）
   POST /api/interview  { resume, jd?, pressure?, messages, cursor?, lang? }  ->  InterviewTurn
   模型无记忆：每轮把完整对话历史 + 简历 + JD 全量传入，返回面试官的下一句。

   分工：题号 / 追问层级 / 何时收尾由【服务端】用游标确定性推进并封顶追问（追问 ≤ 3 层、
   主问题 ≈ 8 道），模型只产出 reply / kind / vague。出题与追问措辞见 lib/interview-prompts.ts。
   ============================================================ */

import { NextResponse } from "next/server";
import {
  buildInterviewMessages,
  themeFor,
  TARGET_QUESTIONS,
  MAX_FOLLOW_UPS,
  type TurnDirective,
} from "@/lib/interview-prompts";
import { MAX_BRIEF } from "@/lib/jd-research";
import { clientIp, rateLimit, type RateRule } from "@/lib/ratelimit";
import type { InterviewMessage, InterviewTurn, InterviewKind } from "@/lib/types";
import type { Lang } from "@/lib/rubric";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RESUME = 6000;
const RATE: RateRule = { windowMs: 60_000, max: 40 }; // 订阅制不计 token，宽松设限：仅防脚本/失控刷量（每 IP 每分钟 40 轮）
const MAX_MSG = 4000;     // 单条消息截断
const MAX_HISTORY = 40;   // 只保留最近 N 条，防 prompt 膨胀
const HARD_DONE_AT = 24;  // 候选人回答数 ≥ 此值：服务端强制收尾（防失控）

const KINDS: InterviewKind[] = ["question", "follow_up", "closing"];

/** 容错解析：去代码块、提取最外层 {...} */
function parseTurn(content: string): any {
  const tryParse = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
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

/** 最低可用门槛：有一句非空 reply、kind 合法 */
function turnOk(r: any): boolean {
  return !!r && typeof r.reply === "string" && r.reply.trim().length > 0 && KINDS.includes(r.kind);
}

async function callLLM(messages: { role: string; content: string }[], clientSignal?: AbortSignal): Promise<string> {
  const base = process.env.LLM_BASE_URL;
  const key = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!base || !key || !model) throw new Error("LLM env not configured");

  // 单轮发言很短，20s 预算足够；同时接住客户端取消，用户离开即掐断上游
  const timeout = AbortSignal.timeout(20_000);
  const signal = clientSignal ? AbortSignal.any([timeout, clientSignal]) : timeout;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.5,
      max_tokens: 700,
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
  console.log(`[interview] finish=${choice?.finish_reason} len=${content.length} out_tokens=${data?.usage?.completion_tokens}`);
  return content;
}

/** 规整入参里的 messages：过滤非法项、截断、限长 */
function sanitizeHistory(raw: unknown): InterviewMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: InterviewMessage[] = [];
  for (const m of raw) {
    if (!m || (m.role !== "interviewer" && m.role !== "candidate")) continue;
    if (typeof m.content !== "string") continue;
    const content = m.content.slice(0, MAX_MSG).trim();
    if (!content) continue;
    out.push({ role: m.role, content });
  }
  return out.slice(-MAX_HISTORY);
}

const toInt = (n: unknown, dflt: number) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n) : dflt);

interface Plan {
  directive: TurnDirective;
  currentQuestion: number;
  followDepth: number;
  nextQuestion: number;
}

/** 由游标 + 对话长度确定性地框定本轮性质（不依赖模型自报计数） */
function planTurn(history: InterviewMessage[], cursor: any): Plan {
  const isFirst = history.length === 0;
  const prevQ = isFirst ? 0 : Math.max(1, toInt(cursor?.question_index, 1));
  const prevDepth = Math.max(0, toInt(cursor?.follow_up_depth, 0));
  const answered = history.filter((m) => m.role === "candidate").length;

  const base = { currentQuestion: prevQ, followDepth: prevDepth, nextQuestion: Math.min(prevQ + 1, TARGET_QUESTIONS) };

  if (isFirst) return { ...base, directive: "first", nextQuestion: 1 };
  if (answered >= HARD_DONE_AT) return { ...base, directive: "close" };
  if (prevDepth >= MAX_FOLLOW_UPS) {
    // 追问封顶：要么进下一题，要么（已是最后一题）收尾
    return prevQ >= TARGET_QUESTIONS ? { ...base, directive: "close" } : { ...base, directive: "advance" };
  }
  return { ...base, directive: "open" };
}

/** 服务端按 directive + 模型的 kind 判断，确定性算出最终计数与收尾，不全信模型 */
function resolve(plan: Plan, modelKind: InterviewKind): Omit<InterviewTurn, "reply" | "vague"> {
  const t = TARGET_QUESTIONS;
  const mk = (kind: InterviewKind, q: number, depth: number, done: boolean): Omit<InterviewTurn, "reply" | "vague"> => ({
    kind, question_index: Math.min(Math.max(q, 1), t), follow_up_depth: Math.min(Math.max(depth, 0), MAX_FOLLOW_UPS), done, total_questions: t,
  });

  switch (plan.directive) {
    case "first":
      return mk("question", 1, 0, false);
    case "close":
      return mk("closing", plan.currentQuestion, 0, true);
    case "advance":
      return mk("question", plan.currentQuestion + 1, 0, false);
    case "open":
    default:
      if (modelKind === "follow_up") return mk("follow_up", plan.currentQuestion, plan.followDepth + 1, false);
      // 模型选择推进 / 收尾：仅在最后一题之后才允许收尾，否则进入下一题
      if (plan.currentQuestion >= t) return mk("closing", t, 0, true);
      return mk("question", plan.currentQuestion + 1, 0, false);
  }
}

export async function POST(req: Request) {
  // 限流前置：挡住刷量再调模型
  const rl = rateLimit(`interview:${clientIp(req)}`, RATE);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  let body: { resume?: string; jd?: string; pressure?: boolean; messages?: unknown; cursor?: unknown; brief?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const resume = (body.resume ?? "").slice(0, MAX_RESUME);
  const jd = body.jd?.slice(0, MAX_RESUME);
  const brief = typeof body.brief === "string" ? body.brief.slice(0, MAX_BRIEF) : undefined;
  const pressure = body.pressure === true;
  const lang: Lang = body.lang === "en" ? "en" : "zh";
  const history = sanitizeHistory(body.messages);

  if (!resume.trim()) {
    return NextResponse.json({ error: "empty_resume" }, { status: 400 });
  }

  // 配置缺失不可重试：前置 500，不泄露细节、不陪跑循环
  if (!process.env.LLM_API_KEY || !process.env.LLM_BASE_URL || !process.env.LLM_MODEL) {
    console.error("[interview] LLM env not configured");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const plan = planTurn(history, body.cursor);
  const messages = buildInterviewMessages({
    resume, jd, brief, history, pressure, lang,
    directive: plan.directive,
    currentQuestion: plan.currentQuestion,
    followDepth: plan.followDepth,
    nextQuestion: plan.nextQuestion,
    nextTheme: themeFor(lang, plan.nextQuestion),
  });

  // 最多两次：拿到合法 turn 即返回
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const content = await callLLM(messages, req.signal);
      const raw = parseTurn(content);
      if (turnOk(raw)) {
        const counters = resolve(plan, raw.kind);
        const turn: InterviewTurn = { reply: String(raw.reply).trim(), vague: raw.vague === true, ...counters };
        return NextResponse.json(turn);
      }
    } catch (e) {
      // 错误细节只留服务端日志，绝不透传客户端
      console.error(`[interview] attempt ${attempt} failed:`, e instanceof Error ? e.message : e);
      if (attempt === 1) {
        return NextResponse.json({ error: "llm_error" }, { status: 502 });
      }
    }
  }
  return NextResponse.json({ error: "bad_turn" }, { status: 502 });
}
