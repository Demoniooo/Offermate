"use client";

import { useEffect, useRef, useState } from "react";
import { INTERVIEW_I18N, type Lang } from "@/lib/interview-i18n";
import "./interview.css";

type Phase = "prep" | "prepload" | "chat" | "endload";
type Msg = { who: "ai" | "me"; text: string; fu?: boolean; depth?: number; vague?: boolean };

export default function Interview() {
  const [lang, setLang] = useState<Lang>("zh");
  const [phase, setPhase] = useState<Phase>("prep");
  const [empty, setEmpty] = useState(false);
  const [pressure, setPressure] = useState(false);
  const [qi, setQi] = useState(0);
  const [depth, setDepth] = useState(1);
  const [thinking, setThinking] = useState(false);
  const [ended, setEnded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [prepStep, setPrepStep] = useState(0);
  const [endStep, setEndStep] = useState(0);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const t = INTERVIEW_I18N[lang];
  const isZh = lang === "zh";

  const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  const later = (fn: () => void, ms: number) => { timersRef.current.push(setTimeout(fn, reduced() ? Math.min(ms, 150) : ms)); };
  const pushMsg = (m: Msg) => setMessages((prev) => [...prev, m]);

  // ?empty=1 看空状态
  useEffect(() => {
    try { if (new URLSearchParams(window.location.search).get("empty") === "1") setEmpty(true); } catch { /* noop */ }
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = isZh ? "zh-CN" : "en";
    document.title = isZh ? "OfferMate — 模拟面试" : "OfferMate — Mock interview";
  }, [isZh]);

  // 阶段切换回顶部
  useEffect(() => { window.scrollTo(0, 0); }, [phase]);
  // 聊天有新消息/思考态 → 滚到底
  useEffect(() => {
    if (phase !== "chat") return;
    window.scrollTo({ top: document.body.scrollHeight, behavior: reduced() ? "auto" : "smooth" });
  }, [messages, thinking, phase]);

  // textarea 自适应高度
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 128) + "px";
  }, [input, phase]);

  function aiSay(text: string, opt: { fu?: boolean; depth?: number } = {}, onDone?: () => void) {
    setThinking(true);
    later(() => {
      pushMsg({ who: "ai", text, fu: opt.fu, depth: opt.depth });
      setThinking(false);
      taRef.current?.focus({ preventScroll: true });
      onDone?.();
    }, 900 + Math.random() * 600);
  }

  function startPrep() {
    setPhase("prepload");
    setPrepStep(0);
    later(() => setPrepStep(1), 900);
    later(() => setPrepStep(2), 1900);
    later(startChat, 3000);
  }
  function cancelPrep() { clearTimers(); setPhase("prep"); }

  function startChat() {
    clearTimers();
    setQi(0); setDepth(1); setEnded(false); setThinking(false); setMessages([]);
    setPhase("chat");
    aiSay(t.intro, {}, () => later(() => aiSay(t.bank[0].q), reduced() ? 100 : 700));
  }

  function send() {
    if (thinking || ended) return;
    const v = input.trim();
    if (!v) return;
    const q = t.bank[qi];
    const threshold = pressure ? 60 : 40;
    const isLast = qi === 7;
    const vague = !isLast && (v.length < threshold || !/\d/.test(v));
    const canFollow = vague && depth - 1 < q.fus.length;
    pushMsg({ who: "me", text: v, vague: vague && canFollow });
    setInput("");
    if (canFollow) {
      const fu = q.fus[depth - 1] + (pressure ? (isZh ? "" : " ") + t.pressure_suffix : "");
      const nd = depth + 1;
      setDepth(nd);
      aiSay(fu, { fu: true, depth: nd });
    } else {
      const nq = qi + 1;
      setQi(nq);
      setDepth(1);
      if (nq >= 8) { endInterview(); return; }
      aiSay(t.bank[nq].q);
    }
  }

  function askEnd() { setShowConfirm(true); }
  function endInterview() {
    clearTimers();
    setEnded(true);
    setShowConfirm(false);
    setThinking(false);
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
      {phase === "prep" && (
        <section id="phase-prep">
          <div className="wrap">
            <div className="prep-head">
              <div className="eyebrow">{t.prep_eyebrow}</div>
              <h1>{t.prep_title}</h1>
              <p>{t.prep_sub}</p>
            </div>
            {!empty ? (
              <div className="prep-card">
                <div className="job">
                  <div className="job-row"><small>{t.job_role_label}</small><b>{t.job_role}</b></div>
                  <div className="job-row"><small>{t.job_co_label}</small><span>{t.job_co}</span></div>
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
                  <button className="btn btn-ghost btn-lg" onClick={() => setEmpty(false)}>{t.empty_secondary}</button>
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
                <span>{t.prepload_foot}</span>
                <a onClick={cancelPrep}>{t.cancel_btn}</a>
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
