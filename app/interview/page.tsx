"use client";

import { useEffect, useRef, useState } from "react";
import { INTERVIEW_I18N, type Lang } from "@/lib/interview-i18n";
import type { InterviewTurn, InterviewMessage } from "@/lib/types";
import "./interview.css";

type Phase = "prep" | "prepload" | "chat" | "endload";
type Msg = { who: "ai" | "me"; text: string; fu?: boolean; depth?: number; vague?: boolean };
type Ctx = { resume: string; jd: string; role?: string };

const CTX_KEY = "om:interview:ctx";
const RESULT_KEY = "om:interview:result";

/** 「用样例直接开始」用的内置上下文（含可被追问的具体声明） */
const SAMPLE: Record<Lang, Ctx> = {
  zh: {
    role: "产品运营实习生 · 抖音电商",
    resume: `王悦 · 求职意向：产品运营实习生
教育：某大学 市场营销 本科 2022–2026
实习：某 MCN 机构 · 达人运营实习生（2024.06–2024.09）
- 负责 20+ 腰部达人的日常运营与活动对接
- 主导一次直播带货专场，GMV 较上月提升约 30%
- 参与社群拉新活动，7 日留存提升 11%
项目：校园二手交易平台（课程项目）· 运营推广负责人
技能：Excel、SQL（了解）、剪映、数据看板`,
    jd: `产品运营实习生 · 抖音电商（字节跳动）
- 负责达人/商家活动的策划与执行，跟踪 GMV、转化率等核心指标并复盘
- 能用 SQL 取数、做基础数据分析
- 较强的沟通协调与抗压能力
- 加分：有直播电商 / 社群运营经验`,
  },
  en: {
    role: "Product Ops Intern · Douyin e-Commerce",
    resume: `Wang Yue · Target role: Product Ops Intern
Education: BA Marketing, 2022–2026
Internship: an MCN agency · Creator-ops intern (Jun–Sep 2024)
- Ran daily ops and event coordination for 20+ mid-tier creators
- Led one livestream sale; GMV up ~30% vs the prior month
- Ran a community growth campaign; 7-day retention up 11%
Project: campus second-hand marketplace (course project) · ops & growth lead
Skills: Excel, SQL (basic), video editing, dashboards`,
    jd: `Product Ops Intern · Douyin e-Commerce (ByteDance)
- Plan and run creator/merchant campaigns; track GMV, conversion and debrief
- Pull data with SQL and do basic analysis
- Strong communication and resilience
- Plus: livestream-commerce / community-ops experience`,
  },
};

async function postJSON<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data && data.error) || `HTTP ${res.status}`);
  return data as T;
}

const toApi = (msgs: Msg[]): InterviewMessage[] =>
  msgs.map((m) => ({ role: m.who === "ai" ? "interviewer" : "candidate", content: m.text }));

const firstLine = (s?: string, n = 36) => {
  const line = (s || "").split("\n").map((x) => x.trim()).find(Boolean) || "";
  return line.length > n ? line.slice(0, n) + "…" : line;
};

export default function Interview() {
  const [lang, setLang] = useState<Lang>("zh");
  const [phase, setPhase] = useState<Phase>("prep");
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [pressure, setPressure] = useState(false);
  const [qi, setQi] = useState(0); // 0-based：question_index - 1
  const [depth, setDepth] = useState(1); // 1-based 展示：min(follow_up_depth+1, 3)
  const [thinking, setThinking] = useState(false);
  const [ended, setEnded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [prepStep, setPrepStep] = useState(0);
  const [endStep, setEndStep] = useState(0);
  const [prepError, setPrepError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [booted, setBooted] = useState(false); // 读完 sessionStorage 前不渲染 prep，避免空态闪一下

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const briefRef = useRef<string>("");
  const cursorRef = useRef<{ question_index: number; follow_up_depth: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const t = INTERVIEW_I18N[lang];
  const isZh = lang === "zh";

  const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  const later = (fn: () => void, ms: number) => { timersRef.current.push(setTimeout(fn, reduced() ? Math.min(ms, 150) : ms)); };
  const abort = () => { abortRef.current?.abort(); abortRef.current = null; };

  // 入口：?empty=1 强制空态；否则读诊断带过来的上下文
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("empty") !== "1") {
        const raw = sessionStorage.getItem(CTX_KEY);
        if (raw) {
          const c = JSON.parse(raw);
          if (c && typeof c.resume === "string" && c.resume.trim()) {
            setCtx({ resume: c.resume, jd: typeof c.jd === "string" ? c.jd : "", role: c.role });
            if (c.lang === "en" || c.lang === "zh") setLang(c.lang);
          }
        }
      }
    } catch { /* noop */ }
    setBooted(true);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = isZh ? "zh-CN" : "en";
    document.title = isZh ? "OfferMate — 模拟面试" : "OfferMate — Mock interview";
  }, [isZh]);

  useEffect(() => { window.scrollTo(0, 0); }, [phase]);
  useEffect(() => {
    if (phase !== "chat") return;
    window.scrollTo({ top: document.body.scrollHeight, behavior: reduced() ? "auto" : "smooth" });
  }, [messages, thinking, phase]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 128) + "px";
  }, [input, phase]);

  /** 把一轮 API 结果落到展示态（qi 0-based、depth 1-based 展示）+ 更新游标 */
  function applyTurn(turn: InterviewTurn) {
    setQi(Math.max(0, turn.question_index - 1));
    setDepth(Math.min(turn.follow_up_depth + 1, 3));
    cursorRef.current = { question_index: turn.question_index, follow_up_depth: turn.follow_up_depth };
  }

  // ============ 准备：联网研究 JD → 第一题 ============
  function startPrep() {
    if (!ctx) return;
    abort();
    setPhase("prepload");
    setPrepStep(0);
    setPrepError(false);
    later(() => setPrepStep(1), 900);
    later(() => setPrepStep(2), 1900);
    void prepareAndStart();
  }

  async function prepareAndStart() {
    if (!ctx) return;
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const prep = await postJSON<{ brief: string }>("/api/interview/prepare", { resume: ctx.resume, jd: ctx.jd, lang }, ac.signal);
      briefRef.current = prep.brief || "";
      const turn = await postJSON<InterviewTurn>("/api/interview", { resume: ctx.resume, jd: ctx.jd, brief: briefRef.current, pressure, messages: [], lang }, ac.signal);
      clearTimers();
      cursorRef.current = null;
      setMessages([{ who: "ai", text: turn.reply, fu: false, depth: 0 }]);
      applyTurn(turn);
      setEnded(false);
      setThinking(false);
      setSendError(false);
      setPhase("chat");
      taRef.current?.focus({ preventScroll: true });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      clearTimers();
      setPrepError(true);
    }
  }

  function cancelPrep() { abort(); clearTimers(); setPrepError(false); setPhase("prep"); }

  // ============ 对话轮次 ============
  function send() {
    if (thinking || ended) return;
    const v = input.trim();
    if (!v) return;
    const next = [...messages, { who: "me" as const, text: v }];
    setMessages(next);
    setInput("");
    void askAI(next);
  }

  async function askAI(history: Msg[]) {
    if (!ctx) return;
    abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setThinking(true);
    setSendError(false);
    try {
      const turn = await postJSON<InterviewTurn>("/api/interview", {
        resume: ctx.resume, jd: ctx.jd, brief: briefRef.current, pressure,
        messages: toApi(history), cursor: cursorRef.current ?? undefined, lang,
      }, ac.signal);
      setThinking(false);
      // 给刚回答的那条用户气泡补上 vague 标记，再追加面试官这一句
      setMessages((prev) => {
        const out = prev.map((m, i) => (i === prev.length - 1 && m.who === "me" ? { ...m, vague: !!turn.vague } : m));
        return [...out, { who: "ai", text: turn.reply, fu: turn.kind === "follow_up", depth: turn.follow_up_depth }];
      });
      applyTurn(turn);
      taRef.current?.focus({ preventScroll: true });
      if (turn.done) { setEnded(true); later(endInterview, 1600); }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      setThinking(false);
      setSendError(true);
    }
  }

  function askEnd() { setShowConfirm(true); }

  function endInterview() {
    abort();
    clearTimers();
    setEnded(true);
    setShowConfirm(false);
    setThinking(false);
    // 把整场对话 + 上下文留给复盘（D13 /api/debrief 用）
    try {
      sessionStorage.setItem(RESULT_KEY, JSON.stringify({
        resume: ctx?.resume ?? "", jd: ctx?.jd ?? "", brief: briefRef.current, pressure, lang,
        messages: toApi(messages),
      }));
    } catch { /* noop */ }
    setPhase("endload");
    setEndStep(0);
    later(() => setEndStep(1), 1100);
    later(() => { window.location.href = "/review"; }, 2600);
  }

  const renderMsg = (m: Msg, i: number) => {
    if (m.who === "me") {
      return (
        <div className="msg me appear" key={i}>
          <span className="av">{t.you}</span>
          <div style={{ textAlign: "right" }}>
            <div className="bubble" style={{ textAlign: "left" }}>{m.text}</div>
            {m.vague && <span className="flag">⚠ {t.vague_flag}</span>}
          </div>
        </div>
      );
    }
    return (
      <div className={`msg ai${m.fu ? " fu" : ""} appear`} key={i}>
        <span className="av">OM</span>
        <div>
          {m.fu ? (
            <div className="fu-body"><span className="fu-tag">{t.fu_tag(m.depth ?? 2)}</span><div className="bubble">{m.text}</div></div>
          ) : (
            <div className="bubble">{m.text}</div>
          )}
        </div>
      </div>
    );
  };

  const roleText = ctx?.role || firstLine(ctx?.jd) || t.job_role;

  return (
    <>
      {/* =================== NAV =================== */}
      <nav>
        <div className="wrap nav-in">
          <a className="brand" href="/" aria-label="OfferMate 首页">
            <svg width="26" height="26" viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="7" fill="#1F1F1F" /><circle cx="13" cy="15" r="6.2" fill="none" stroke="#FFF" strokeWidth="1.6" /><path d="M 9.5 18.5 L 20 8 M 20 8 L 14.5 8 M 20 8 L 20 13.5" stroke="#E4F222" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <b>OfferMate</b>
          </a>
          <span className="tool-label">{t.tool_label}</span>
          <div className="steps" aria-hidden="true">
            <span className="stp on"><i>✓</i><span>{t.step1}</span></span>
            <span className="stp-line" />
            <span className="stp on"><i>2</i><span>{t.step2}</span></span>
            <span className="stp-line" />
            <span className="stp"><i>3</i><span>{t.step3}</span></span>
          </div>
          <div className="lang" role="group" aria-label="Language">
            <button className={isZh ? "on" : ""} onClick={() => setLang("zh")}>中文</button>
            <button className={!isZh ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
        </div>
      </nav>

      {/* =================== 界面1 · 准备 =================== */}
      {phase === "prep" && booted && (
        <section id="phase-prep">
          <div className="wrap">
            <div className="prep-head">
              <div className="eyebrow">{t.prep_eyebrow}</div>
              <h1>{t.prep_title}</h1>
              <p>{t.prep_sub}</p>
            </div>
            {ctx ? (
              <div className="prep-card">
                <div className="job">
                  <div className="job-row"><small>{t.job_role_label}</small><b>{roleText}</b></div>
                  <div className="job-row"><small>{t.job_co_label}</small><span>{isZh ? "来自你的简历 + JD" : "From your resume + JD"}</span></div>
                  <span className="ctx-chip">✓ <span>{t.ctx_chip}</span></span>
                </div>
                <div className="prep-opts">
                  <label className="switch-wrap">
                    <input type="checkbox" checked={pressure} onChange={(e) => setPressure(e.target.checked)} />
                    <span className="switch" aria-hidden="true" />
                    <b>{t.opt_pressure}</b>
                    <span className="meta">{t.opt_pressure_meta}</span>
                  </label>
                </div>
                <div className="prep-foot">
                  <span className="qmeta">{t.q_meta}</span>
                  <button className="btn btn-primary btn-lg" onClick={startPrep}><span>{t.start_btn}</span> →</button>
                </div>
              </div>
            ) : (
              <div className="empty-card">
                <h2>{t.empty_title}</h2>
                <p>{t.empty_body}</p>
                <div className="btns">
                  <a className="btn btn-primary btn-lg" href="/diagnose">{t.empty_primary}</a>
                  <button className="btn btn-ghost btn-lg" onClick={() => setCtx(SAMPLE[lang])}>{t.empty_secondary}</button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =================== 界面1.5 · 准备中 =================== */}
      {phase === "prepload" && (
        <section id="phase-prepload">
          <div className="wrap load-wrap">
            <div className="load-card appear">
              <div className="spinner" aria-hidden="true" />
              <div className="eyebrow" style={{ marginBottom: 8 }}>{t.prepload_eyebrow}</div>
              <h2>{t.prepload_title}</h2>
              <p className="sub">{t.prepload_sub}</p>
              <div className="load-steps">
                {t.prep_steps.map((s, i) => (
                  <div className={`lstep${i < prepStep ? " done" : ""}${i === prepStep ? " active" : ""}`} key={i}>
                    <span className="ic">✓</span><b>{s.l}</b><span>{s.m}</span>
                  </div>
                ))}
              </div>
              <div className="load-foot">
                {prepError ? (
                  <>
                    <span style={{ color: "var(--bad, #B8401F)" }}>{isZh ? "准备失败，请重试" : "Prep failed, please retry"}</span>
                    <span style={{ display: "flex", gap: 14 }}>
                      <a onClick={startPrep}>{isZh ? "重试" : "Retry"}</a>
                      <a onClick={cancelPrep}>{t.cancel_btn}</a>
                    </span>
                  </>
                ) : (
                  <>
                    <span>{t.prepload_foot}</span>
                    <a onClick={cancelPrep}>{t.cancel_btn}</a>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =================== 界面2 · 面试中 =================== */}
      {phase === "chat" && (
        <section id="phase-chat">
          <div className="status">
            <div className="status-in">
              <span className="q">Q <span>{Math.min(qi + 1, 8)}</span><small>/8</small></span>
              <span className="lv"><span className="lv-word">{t.lv_label}</span> <b>L{depth}</b><span style={{ color: "var(--faint)" }}>/L3</span></span>
              {pressure && <span className="pressure"><i /><span>{t.pressure_on}</span></span>}
              <button className="btn btn-ghost btn-sm end" onClick={askEnd}>{t.end_btn}</button>
            </div>
            <div className="progress"><i style={{ width: `${(qi / 8) * 100}%` }} /></div>
          </div>

          <div id="chat" aria-live="polite">
            {messages.map(renderMsg)}
            {thinking && (
              <div className="msg ai"><span className="av">OM</span><span className="typing"><i /><i /><i /></span></div>
            )}
          </div>

          <div className={`dock${ended ? " ended" : ""}`}>
            <div className="dock-in">
              {showConfirm && (
                <div className="confirm-bar">
                  <p>{t.confirm_text(qi)}</p>
                  <button className="btn btn-primary btn-sm" onClick={endInterview}>{t.confirm_yes}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowConfirm(false)}>{t.confirm_no}</button>
                </div>
              )}
              {sendError && (
                <div className="confirm-bar">
                  <p>{isZh ? "刚才那一轮没成功，重试一下？" : "That turn failed — retry?"}</p>
                  <button className="btn btn-primary btn-sm" onClick={() => askAI(messages)}>{isZh ? "重试" : "Retry"}</button>
                </div>
              )}
              <div className="input-row">
                <div className="input-box">
                  <textarea
                    ref={taRef}
                    rows={1}
                    value={input}
                    disabled={thinking || ended}
                    placeholder={thinking ? t.thinking_ph : t.input_ph}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  />
                  <span className="count"><span>{input.length}</span><span>{t.count_unit}</span></span>
                </div>
                <button className="btn btn-primary" id="sendBtn" onClick={send} disabled={thinking || ended}>{t.send_btn}</button>
              </div>
              <div className="dock-tip">{t.dock_tip}</div>
              <div className="ended-bar"><span>{t.ended_tip}</span></div>
            </div>
          </div>
        </section>
      )}

      {/* =================== 界面3 · 生成复盘 =================== */}
      {phase === "endload" && (
        <section id="phase-endload">
          <div className="wrap load-wrap">
            <div className="load-card appear">
              <div className="spinner" aria-hidden="true" />
              <div className="eyebrow" style={{ marginBottom: 8 }}>{t.endload_eyebrow}</div>
              <h2>{t.endload_title}</h2>
              <p className="sub">{t.endload_sub}</p>
              <div className="load-steps">
                {t.end_steps.map((s, i) => (
                  <div className={`lstep${i < endStep ? " done" : ""}${i === endStep ? " active" : ""}`} key={i}>
                    <span className="ic">✓</span><b>{s.l}</b><span>{s.m}</span>
                  </div>
                ))}
              </div>
              <div className="load-foot"><span>{t.endload_foot}</span><span /></div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
