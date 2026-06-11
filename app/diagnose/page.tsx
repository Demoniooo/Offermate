"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DIAGNOSIS_I18N, SEV_COLORS, type Lang } from "@/lib/diagnosis-i18n";
import "./diagnose.css";

type Phase = "input" | "loading" | "report";
const TARGET_SCORE = 86;

export default function Diagnose() {
  const [lang, setLang] = useState<Lang>("zh");
  const [phase, setPhase] = useState<Phase>("input");
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [pressure, setPressure] = useState(false);
  const [anon, setAnon] = useState(true);
  const [loadStep, setLoadStep] = useState(0);
  const [shown, setShown] = useState(false);
  const [bigScore, setBigScore] = useState(0);
  const [toastMsg, setToastMsg] = useState("");

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const t = DIAGNOSIS_I18N[lang];

  const reducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  function runDiagnosis() {
    clearTimers();
    setLoadStep(0);
    setPhase("loading");
    const seq = reducedMotion() ? [80, 160, 240, 320] : [700, 1500, 2300, 2900];
    timersRef.current = [
      setTimeout(() => setLoadStep(1), seq[0]),
      setTimeout(() => setLoadStep(2), seq[1]),
      setTimeout(() => setLoadStep(3), seq[2]),
      setTimeout(() => setPhase("report"), seq[3]),
    ];
  }

  function cancelDiagnosis() {
    clearTimers();
    setPhase("input");
  }

  function backToInput() {
    setPhase("input");
  }

  function loadSample(autoRun: boolean) {
    setResume(t.sample_resume);
    setJd(t.sample_jd);
    if (autoRun) setTimeout(runDiagnosis, 80);
  }

  function toast(msg: string) {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2600);
  }

  // 语言 → 标题 / <html lang>
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = lang === "zh" ? "OfferMate — 简历诊断" : "OfferMate — Resume diagnosis";
  }, [lang]);

  // 切换阶段回到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  // 进入报告：分数滚动 + 进度条揭示
  useEffect(() => {
    if (phase !== "report") {
      setShown(false);
      setBigScore(0);
      return;
    }
    const revealT = setTimeout(() => setShown(true), 30);
    if (reducedMotion()) {
      setBigScore(TARGET_SCORE);
      return () => clearTimeout(revealT);
    }
    let id = 0;
    let start: number | undefined;
    const dur = 850;
    const tick = (now: number) => {
      if (start === undefined) start = now;
      const k = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setBigScore(Math.round(TARGET_SCORE * e));
      if (k < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    // 兜底：若 rAF 时间戳不前进（如某些 headless / 后台标签页），也保证终值
    const doneT = setTimeout(() => setBigScore(TARGET_SCORE), dur + 120);
    return () => {
      clearTimeout(revealT);
      clearTimeout(doneT);
      cancelAnimationFrame(id);
    };
  }, [phase]);

  // ?sample=1 直接看样例报告（落地页「看样例报告」带此参数进来）
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("sample") === "1") {
        loadSample(true);
      }
    } catch {
      /* noop */
    }
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Radar = () => (
    <svg className="radar" viewBox="0 0 320 320" aria-hidden="true">
      <polygon className="grid" points="160,50 264.62,126.01 224.68,248.99 95.32,248.99 55.38,126.01" />
      <polygon className="grid" points="160,77.5 238.46,134.51 208.51,226.74 111.49,226.74 81.54,134.51" />
      <polygon className="grid" points="160,105 212.31,143 192.34,204.5 127.66,204.5 107.69,143" />
      <polygon className="grid" points="160,132.5 186.15,151.5 176.17,182.25 143.83,182.25 133.85,151.5" />
      <line className="grid" x1="160" y1="160" x2="160" y2="50" />
      <line className="grid" x1="160" y1="160" x2="264.62" y2="126.01" />
      <line className="grid" x1="160" y1="160" x2="224.68" y2="248.99" />
      <line className="grid" x1="160" y1="160" x2="95.32" y2="248.99" />
      <line className="grid" x1="160" y1="160" x2="55.38" y2="126.01" />
      <polygon className="shape" points="160,74.2 245.77,132.13 205.92,223.18 105.02,235.64 80.5,134.17" />
      <circle cx="160" cy="74.2" r="3.5" />
      <circle cx="245.77" cy="132.13" r="3.5" />
      <circle cx="205.92" cy="223.18" r="3.5" />
      <circle cx="105.02" cy="235.64" r="3.5" />
      <circle cx="80.5" cy="134.17" r="3.5" />
      <text x="160" y="36" textAnchor="middle">{t.dim_1}</text>
      <text x="288" y="122" textAnchor="middle">{t.dim_2}</text>
      <text x="232" y="274" textAnchor="middle">{t.dim_3}</text>
      <text x="88" y="274" textAnchor="middle">{t.dim_4}</text>
      <text x="34" y="122" textAnchor="middle">{t.dim_5}</text>
    </svg>
  );

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
            <span className="stp on"><i>1</i><span>{t.step1_label}</span></span>
            <span className="stp-line" />
            <span className={`stp${phase === "report" ? " on" : ""}`}><i>2</i><span>{t.step2_label}</span></span>
            <span className="stp-line" />
            <span className="stp"><i>3</i><span>{t.step3_label}</span></span>
          </div>
          <div className="lang" role="group" aria-label="Language">
            <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中文</button>
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
        </div>
      </nav>

      {/* =================== PHASE: INPUT =================== */}
      {phase === "input" && (
        <section id="phase-input">
          <div className="wrap">
            <div className="in-head">
              <div>
                <div className="eyebrow">{t.input_eyebrow}</div>
                <h1>{t.input_title}</h1>
                <p>{t.input_sub}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => loadSample(false)}><span>{t.load_sample_btn}</span> ↓</button>
            </div>

            <div className="input-card">
              <div className="input-grid">
                <div className="field">
                  <div className="f-label">
                    <span className="num">1</span><b>{t.resume_field_label}</b>
                    <span className="tagx req">{t.required_tag}</span>
                    <span className="count">{resume.length} {t.count_unit}</span>
                  </div>
                  <textarea id="resume" value={resume} placeholder={t.resume_placeholder} onChange={(e) => setResume(e.target.value)} />
                  <div className="tips">
                    <span>ⓘ <span>{t.tip_1}</span></span>
                    <span>· <span>{t.tip_2}</span></span>
                  </div>
                </div>
                <div className="field">
                  <div className="f-label">
                    <span className="num">2</span><b>{t.jd_field_label}</b>
                    <span className="tagx opt">{t.optional_tag}</span>
                  </div>
                  <textarea id="jd" value={jd} placeholder={t.jd_placeholder} onChange={(e) => setJd(e.target.value)} />
                  <div className="opts-label">{t.options_label}</div>
                  <label className="opt"><input type="checkbox" checked={pressure} onChange={(e) => setPressure(e.target.checked)} /><b>{t.opt_pressure}</b><span>{t.opt_pressure_meta}</span></label>
                  <label className="opt"><input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /><b>{t.opt_anon}</b><span>{t.opt_anon_meta}</span></label>
                </div>
              </div>
              <div className="input-foot">
                <div className="privacy">
                  <span>✓ <span>{t.privacy_1}</span></span>
                  <span>· <span>{t.privacy_2}</span></span>
                  <span>· <span>{t.privacy_3}</span></span>
                </div>
                <button className="btn btn-primary btn-lg" disabled={resume.trim().length === 0} onClick={() => runDiagnosis()}><span>{t.generate_btn}</span> →</button>
              </div>
            </div>

            <div className="perks">
              {t.perks.map((p, i) => (
                <div className="perk" key={i}><b>{p.tag}</b><p>{p.text}</p></div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =================== PHASE: LOADING =================== */}
      {phase === "loading" && (
        <section id="phase-loading">
          <div className="wrap">
            <div className="load-card appear">
              <div className="spinner" aria-hidden="true" />
              <div className="eyebrow" style={{ marginBottom: 8 }}>{t.loading_eyebrow}</div>
              <h2>{t.loading_title}</h2>
              <p className="sub">{t.loading_sub}</p>
              <div className="load-steps">
                {t.loading_steps.map((s, i) => (
                  <div className={`lstep${i < loadStep ? " done" : ""}${i === loadStep ? " active" : ""}`} key={i}>
                    <span className="ic">✓</span><b>{s.label}</b><span>{s.meta}</span>
                  </div>
                ))}
              </div>
              <div className="load-foot">
                <span>{t.loading_footer_label}</span>
                <a href="#" onClick={(e) => { e.preventDefault(); cancelDiagnosis(); }}>{t.cancel_btn}</a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =================== PHASE: REPORT =================== */}
      {phase === "report" && (
        <section id="phase-report">
          <div className="wrap">
            <div className="rep-bar">
              <div>
                <div className="eyebrow">{t.report_eyebrow}</div>
                <h1>{t.report_title}</h1>
                <div className="rep-meta">
                  <span>{t.report_meta_1}</span><span>·</span>
                  <span>{t.report_meta_2}</span><span>·</span>
                  <span>{t.report_meta_3}</span>
                </div>
              </div>
              <div className="btns" style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => backToInput()}>← <span>{t.edit_btn}</span></button>
                <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>{t.export_btn}</button>
              </div>
            </div>

            {/* 总览 */}
            <div className={`card${shown ? " shown" : ""}`}>
              <div className="sum-grid">
                <div>
                  <div className="eyebrow" style={{ marginBottom: 2, color: "var(--mute)" }}>{t.overall_label}</div>
                  <div className="big-score"><b>{bigScore}</b><span>/100</span></div>
                  <div className="level"><i /><span>{t.level_tag}</span></div>
                  <p className="blurb">{t.summary_blurb}</p>
                  <div className="kpis">
                    <div className="kpi warn"><small>{t.kpi_findings}</small><b>7</b><span>{t.items_unit}</span></div>
                    <div className="kpi ok"><small>{t.kpi_rewrites}</small><b>12</b><span>{t.items_unit}</span></div>
                  </div>
                </div>
                <div className="sum-right">
                  <Radar />
                  <div className="dim-rows">
                    {t.dim_rows.map((r, i) => (
                      <div className="dim-row" key={i}>
                        <div className="t"><b>{r.label}</b><span style={{ color: r.c }}>{r.score} <span style={{ color: "var(--faint)", fontWeight: 400 }}>/100</span></span></div>
                        <div className="bar"><i style={{ "--w": `${r.score}%`, background: r.c } as CSSProperties} /></div>
                        <div className="dim-note">{r.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 关键发现 */}
            <div className="sec-row">
              <h2><span className="num">02 · </span><span>{t.findings_title}</span></h2>
              <span className="right">7 <span>{t.findings_total_label}</span></span>
            </div>
            <div className="findings">
              {t.findings.map((f, i) => {
                const c = SEV_COLORS[f.k];
                return (
                  <div className="finding" key={i}>
                    <div className="find-top"><span className="sev" style={{ color: c.fg, background: c.bg, borderColor: c.bd }}>{f.sev}</span><span>{f.dim}</span></div>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                    <div className="affected">{f.affected}</div>
                  </div>
                );
              })}
            </div>

            {/* 改写示例 */}
            <div className="sec-row">
              <h2><span className="num">03 · </span><span>{t.rewrites_title}</span></h2>
              <span className="right">{t.rewrites_count_label}</span>
            </div>
            <div>
              {t.rewrites.map((r, i) => (
                <div className="rw" key={i}>
                  <div className="rw-head"><span className="id">{r.id}</span><span className="sec">{r.sec}</span><span className="tag">{r.tag}</span><span className="imp">{r.imp} ↑</span></div>
                  <div className="rw-grid">
                    <div className="rw-cell before"><small>{t.before_label}</small><p>{r.before}</p><div className="mini-chips">{r.issues.map((x, j) => <span className="mc-issue" key={j}>{x}</span>)}</div></div>
                    <div className="rw-cell after"><small>{t.after_label}</small><p>{r.after}</p><div className="mini-chips">{r.wins.map((x, j) => <span className="mc-win" key={j}>{x}</span>)}</div></div>
                  </div>
                </div>
              ))}
            </div>

            {/* JD 匹配 */}
            <div className="sec-row">
              <h2><span className="num">04 · </span><span>{t.jd_match_title}</span></h2>
              <span className="right match-row"><span>{t.match_label}</span><b>68%</b></span>
            </div>
            <div className="buckets">
              {t.buckets.map((b, i) => (
                <div className="bucket" key={i}>
                  <div className="bucket-h"><b>{b.title}</b><span>{b.hits}/{b.total}</span></div>
                  <div className="bk-chips">
                    {b.items.map(([l, k], j) => {
                      const c = SEV_COLORS[k];
                      return <span key={j} style={{ color: c.fg, background: c.bg, borderColor: c.bd }}>{l}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="recommend"><b>{t.recommend_label}</b><p>{t.recommend_body}</p></div>

            {/* 下一步 */}
            <div className="next">
              <div>
                <div className="eyebrow">{t.next_eyebrow}</div>
                <h2>{t.next_title}</h2>
                <p>{t.next_sub}</p>
              </div>
              <div className="next-btns">
                <button className="btn btn-primary btn-lg" onClick={() => toast(t.toast_msg)}><span>{t.next_btn_primary}</span> →</button>
                <button className="btn btn-ghost btn-lg" onClick={() => backToInput()}>{t.next_btn_secondary}</button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div id="toast" className={toastMsg ? "show" : ""} role="status">{toastMsg}</div>
    </>
  );
}
