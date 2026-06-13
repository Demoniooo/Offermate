/* ============================================================
   OfferMate · 复盘接口（D13）
   POST /api/debrief  { resume, jd?, pressure?, turns, lang? }  ->  InterviewDebrief
   按 lib/interview-rubric.ts 给整场对话评分。
   分工：模型只评判（维度分/点评/话术升级/关键时刻）；
   总分、追问统计、深度分桶由服务端从对话结构算（不交给模型猜）。
   ============================================================ */

import { NextResponse } from "next/server";
import { buildDebriefMessages, DEBRIEF_DIMS } from "@/lib/debrief-prompts";
import type { DebriefTurn, InterviewDebrief, DebriefBucket } from "@/lib/types";
import type { Lang } from "@/lib/rubric";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RESUME = 6000;
const MAX_MSG = 4000;
const MAX_TURNS = 80;

const isStr = (x: unknown) => typeof x === "string" && x.length > 0;
const isNum = (x: unknown) => typeof x === "number" && Number.isFinite(x);
const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const MKINDS = ["hl", "miss", "weak"];

/** 容错解析 */
function parseReport(content: string): any {
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

/** 模型这部分（评判类）结构完整、可渲染 */
function judgedOk(r: any): boolean {
  return (
    !!r &&
    isStr(r.level_tag) &&
    isStr(r.summary) &&
    isStr(r.recommendation) &&
    Array.isArray(r.dimensions) && r.dimensions.length === 5 &&
    r.dimensions.every((d: any) => d && isNum(d.score) && isStr(d.note)) &&
    Array.isArray(r.moments) && r.moments.length >= 1 &&
    r.moments.every((m: any) => m && MKINDS.includes(m.kind) && isStr(m.title) && isStr(m.body) && isStr(m.fix)) &&
    Array.isArray(r.upgrades) && r.upgrades.length >= 1 &&
    r.upgrades.every((u: any) => u && isStr(u.before) && isStr(u.after) && Array.isArray(u.issues) && Array.isArray(u.wins))
  );
}

/** 服务端从对话结构算：主问题序列 + 各题最深追问层 + 追问总数 */
function computeStats(turns: DebriefTurn[]) {
  const questions: { n: number; text: string; depth: number }[] = [];
  let followups = 0;
  for (const t of turns) {
    if (t.role !== "interviewer") continue;
    if (t.fu) {
      followups++;
      const q = questions[questions.length - 1];
      if (q) q.depth = Math.max(q.depth, isNum(t.depth) ? (t.depth as number) : 1);
    } else {
      questions.push({ n: questions.length + 1, text: t.content, depth: 0 });
    }
  }
  return { questions, followups };
}

function buildBuckets(questions: { n: number; text: string; depth: number }[], lang: Lang): DebriefBucket[] {
  const isZh = lang === "zh";
  const short = (s: string) => { const one = s.replace(/\s+/g, " ").trim(); return one.length > 16 ? one.slice(0, 16) + "…" : one; };
  const label = (q: { n: number; text: string }) => `Q${q.n} ${short(q.text)}`;
  const tt = isZh
    ? { ok: "一遍过", weak: "L2 后过关", miss: "L3 仍未答实" }
    : { ok: "Passed in one", weak: "Cleared after L2", miss: "Still vague at L3" };
  const total = questions.length;
  const groups: { title: string; k: DebriefBucket["k"]; arr: typeof questions }[] = [
    { title: tt.ok, k: "ok", arr: questions.filter((q) => q.depth === 0) },
    { title: tt.weak, k: "weak", arr: questions.filter((q) => q.depth >= 1 && q.depth <= 2) },
    { title: tt.miss, k: "miss", arr: questions.filter((q) => q.depth >= 3) },
  ];
  return groups
    .filter((g) => g.arr.length > 0)
    .map((g) => ({ title: g.title, k: g.k, meta: isZh ? `${g.arr.length} / ${total} 题` : `${g.arr.length} / ${total}`, items: g.arr.map(label) }));
}

/** 拼装最终报告：模型评判 + 服务端统计，分数 clamp、维度标签按序锁定 */
function finalize(judged: any, turns: DebriefTurn[], pressure: boolean, lang: Lang): InterviewDebrief {
  const labels = DEBRIEF_DIMS[lang];
  const dimensions = judged.dimensions.slice(0, 5).map((d: any, i: number) => ({
    label: labels[i],           // 锁定标签与顺序（雷达按序贴坐标，不信模型的 label）
    score: clamp100(d.score),
    note: isStr(d.note) ? d.note : "",
  }));
  const overall = clamp100(dimensions.reduce((s: number, d: any) => s + d.score, 0) / 5);

  const moments = judged.moments.map((m: any) => ({
    kind: MKINDS.includes(m.kind) ? m.kind : "weak",
    dim: isStr(m.dim) ? m.dim : "",
    title: isStr(m.title) ? m.title : "",
    body: isStr(m.body) ? m.body : "",
    fix: isStr(m.fix) ? m.fix : "",
    affected: isStr(m.affected) ? m.affected : "",
  }));

  const upgrades = judged.upgrades.map((u: any, i: number) => ({
    id: `#${i + 1}`,
    section: isStr(u.section) ? u.section : "",
    tag: isStr(u.tag) ? u.tag : "",
    improvement: isStr(u.improvement) ? u.improvement : "",
    before: isStr(u.before) ? u.before : "",
    after: isStr(u.after) ? u.after : "",
    issues: (u.issues || []).filter(isStr).slice(0, 4),
    wins: (u.wins || []).filter(isStr).slice(0, 4),
  }));

  const { questions, followups } = computeStats(turns);

  return {
    overall_score: overall,
    level_tag: judged.level_tag,
    summary: judged.summary,
    kpi: { followups, highlights: moments.filter((m: any) => m.kind === "hl").length },
    dimensions,
    moments,
    upgrades,
    buckets: buildBuckets(questions, lang),
    recommendation: judged.recommendation,
    meta: { questions: questions.length, followups, pressure },
  };
}

async function callLLM(messages: { role: string; content: string }[], clientSignal?: AbortSignal): Promise<string> {
  const base = process.env.LLM_BASE_URL;
  const key = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!base || !key || !model) throw new Error("LLM env not configured");

  const timeout = AbortSignal.timeout(25_000);
  const signal = clientSignal ? AbortSignal.any([timeout, clientSignal]) : timeout;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 4000, response_format: { type: "json_object" } }),
    signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`LLM ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const choice = data?.choices?.[0];
  const content: string = choice?.message?.content ?? "";
  console.log(`[debrief] finish=${choice?.finish_reason} len=${content.length} out_tokens=${data?.usage?.completion_tokens}`);
  return content;
}

function sanitizeTurns(raw: unknown): DebriefTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: DebriefTurn[] = [];
  for (const m of raw) {
    if (!m || (m.role !== "interviewer" && m.role !== "candidate")) continue;
    if (typeof m.content !== "string") continue;
    const content = m.content.slice(0, MAX_MSG).trim();
    if (!content) continue;
    out.push({
      role: m.role,
      content,
      fu: m.fu === true,
      depth: isNum(m.depth) ? Math.round(m.depth) : 0,
      vague: m.vague === true,
    });
  }
  return out.slice(-MAX_TURNS);
}

export async function POST(req: Request) {
  let body: { resume?: string; jd?: string; pressure?: boolean; turns?: unknown; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const resume = (body.resume ?? "").slice(0, MAX_RESUME);
  const jd = body.jd?.slice(0, MAX_RESUME);
  const pressure = body.pressure === true;
  const lang: Lang = body.lang === "en" ? "en" : "zh";
  const turns = sanitizeTurns(body.turns);

  // 至少要有候选人答过一题才谈得上复盘
  if (!resume.trim() || !turns.some((t) => t.role === "candidate")) {
    return NextResponse.json({ error: "empty_interview" }, { status: 400 });
  }

  if (!process.env.LLM_API_KEY || !process.env.LLM_BASE_URL || !process.env.LLM_MODEL) {
    console.error("[debrief] LLM env not configured");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const messages = buildDebriefMessages(resume, jd, turns, pressure, lang);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const content = await callLLM(messages, req.signal);
      const judged = parseReport(content);
      if (judgedOk(judged)) return NextResponse.json(finalize(judged, turns, pressure, lang));
    } catch (e) {
      console.error(`[debrief] attempt ${attempt} failed:`, e instanceof Error ? e.message : e);
      if (attempt === 1) return NextResponse.json({ error: "llm_error" }, { status: 502 });
    }
  }
  return NextResponse.json({ error: "incomplete_report" }, { status: 502 });
}
