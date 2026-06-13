"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DIAGNOSIS_I18N, SEV_COLORS, type Lang } from "@/lib/diagnosis-i18n";
import { mockReport } from "@/lib/mock";
import { maskPII } from "@/lib/mask";
import type { DiagnosisReport, Severity, JDStatus } from "@/lib/types";
import "./diagnose.css";

type Phase = "input" | "loading" | "report";
const MAX_RESUME = 6000; // 与 app/api/diagnose/route.ts 的截断上限一致

// severity / status → 颜色 key（SEV_COLORS: ok/weak/miss）
const SEV_KEY: Record<Severity, "ok" | "weak" | "miss"> = { 高: "miss", 中: "weak", 低: "ok" };
const STATUS_KEY: Record<JDStatus, "ok" | "weak" | "miss"> = { 命中: "ok", 弱: "weak", 缺失: "miss" };
const SEV_TEXT: Record<Lang, Record<Severity, string>> = {
  zh: { 高: "高", 中: "中", 低: "低" },
  en: { 高: "High", 中: "Med", 低: "Low" },
};
const dimColor = (score: number) => (score >= 80 ? "#1F1F1F" : "#9A7A1A");

// 雷达图：由五维分数算多边形顶点（与原型静态几何一致：中心 160,160 半径 110，顶点起于正上方顺时针每 72°）
function radarDots(scores: number[]) {
  const cx = 160, cy = 160, R = 110;
  return scores.slice(0, 5).map((s, i) => {
    const ang = ((-90 + 72 * i) * Math.PI) / 180;
    const r = (Math.max(0, Math.min(100, s)) / 100) * R;
    return { x: +(cx + r * Math.cos(ang)).toFixed(2), y: +(cy + r * Math.sin(ang)).toFixed(2) };
  });
}

const AXIS = [
  { x: 160, y: 36 }, { x: 288, y: 122 }, { x: 232, y: 274 }, { x: 88, y: 274 }, { x: 34, y: 122 },
];

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
  const [report, setReport] = useState<DiagnosisReport | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const t = DIAGNOSIS_I18N[lang];
  const isZh = lang === "zh";

  const reducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };
  const stepTimers = (seq: number[]) => {
    timersRef.current = seq.map((ms, i) => setTimeout(() => setLoadStep(i + 1), ms));
  };

  // 真诊断：调 /api/diagnose
  async function runDiagnosis() {
    if (!resume.trim()) return;
    abortRef.current?.abort(); // 终止任何在途请求（防连点双发 / 旧响应回灌）
    const ac = new AbortController();
    abortRef.current = ac;
    clearTimers();
    setError(false);
    setIsDemo(false);
    setLoadStep(0);
    setPhase("loading");
    stepTimers(reducedMotion() ? [60, 120, 180] : [700, 1500, 2300]);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: anon ? maskPII(resume.trim()) : resume.trim(), jd: jd.trim() || undefined, lang }),
        signal: ac.signal,
      });
      if (ac.signal.aborted) return; // 已被取消/被新请求取代：丢弃结果
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as DiagnosisReport;
      if (ac.signal.aborted) return;
      if (typeof data?.overall_score !== "number" || !Array.isArray(data?.findings)) throw new Error("bad");
      clearTimers();
      setReport(data);
      setPhase("report");
    } catch {
      if (ac.signal.aborted) return; // 用户主动取消：静默，不进错误态
      clearTimers();
      setError(true);
    }
  }

  // 样例：用 mock 报告，免费、不调接口（落地页「看样例报告」）
  function runDemo() {
    clearTimers();
    setError(false);
    setIsDemo(true);
    setLoadStep(0);
    setPhase("loading");
    const seq = reducedMotion() ? [60, 120, 180] : [600, 1200, 1800];
    stepTimers(seq);
    timersRef.current.push(
      setTimeout(() => {
        setReport(mockReport);
        setPhase("report");
      }, seq[seq.length - 1] + 600)
    );
  }

  function cancelDiagnosis() {
    abortRef.current?.abort(); // 真正掐断在途的模型调用（配合 route 透传 req.signal）
    clearTimers();
    setError(false);
    setPhase("input");
  }
  function backToInput() {
    setPhase("input");
  }
  function loadSample() {
    setResume(t.sample_resume);
    setJd(t.sample_jd);
  }
  function toast(msg: string) {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2600);
  }

  useEffect(() => {
    document.documentElement.lang = isZh ? "zh-CN" : "en";
    document.title = isZh ? "OfferMate — 简历诊断" : "OfferMate — Resume diagnosis";
  }, [isZh]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  // 进入报告：分数滚动 + 进度条揭示
  useEffect(() => {
    if (phase !== "report" || !report) {
      setShown(false);
      setBigScore(0);
      return;
    }
    const target = report.overall_score;
    const revealT = setTimeout(() => setShown(true), 30);
    if (reducedMotion()) {
      setBigScore(target);
      return () => clearTimeout(revealT);
    }
    let id = 0;
    let start: number | undefined;
    const dur = 850;
    const tick = (now: number) => {
      if (start === undefined) start = now;
      const k = Math.min(1, (now - start) / dur);
      setBigScore(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    const doneT = setTimeout(() => setBigScore(target), dur + 120);
    return () => {
      clearTimeout(revealT);
      clearTimeout(doneT);
      cancelAnimationFrame(id);
    };
  }, [phase, report]);

  // ?sample=1 直接看样例报告
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("sample") === "1") {
        setResume(DIAGNOSIS_I18N.zh.sample_resume);
        setJd(DIAGNOSIS_I18N.zh.sample_jd);
        runDemo();
      }
    } catch {
      /* noop */
    }
    return () => {
      clearTimers();
      clearTimeout(toastTimer.current); // 卸载时清 toast timer
      abortRef.current?.abort(); // 卸载时掐断在途请求
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const methodNote = isZh
    ? "评估依据：NACE · 雇主偏好 · Harvard/MIT · 岗位技能库"
    : "Scored against: NACE · employer surveys · Harvard/MIT · job-skills DB";
  const sourceTag = isDemo
    ? isZh ? "Demo · 模拟数据" : "Demo · sample data"
    : isZh ? "AI · 依据 rubric 生成" : "AI · generated via rubric";

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
            <button className={isZh ? "on" : ""} onClick={() => setLang("zh")}>中文</button>
            <button className={!isZh ? "on" : ""} onClick={() => setLang("en")}>EN</button>
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
              <button className="btn btn-ghost btn-sm" onClick={loadSample}><span>{t.load_sample_btn}</span> ↓</button>
            </div>

            <div className="input-card">
              <div className="input-grid">
                <div className="field">
                  <div className="f-label">
                    <span className="num">1</span><b>{t.resume_field_label}</b>
                    <span className="tagx req">{t.required_tag}</span>
                    <span className={`count${resume.length > MAX_RESUME ? " over" : ""}`}>
                      {resume.length} {t.count_unit}
                      {resume.length > MAX_RESUME && (isZh ? ` · 超 ${MAX_RESUME} 字将被截断` : ` · over ${MAX_RESUME} truncated`)}
                    </span>
                  </div>
                  <textarea id="resume" value={resume} placeholder={t.resume_placeholder} onChange={(e) => setResume(e.target.value)} />
                  <div className="tips">
                    <span>ⓘ <span>{t.tip_1}</span></span>
                    <span>· <span>{t.tip_2}</span></span>
                    <span>🔒 <span>{t.pii_warn}</span></span>
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
                <button className="btn btn-primary btn-lg" disabled={resume.trim().length === 0} onClick={runDiagnosis}><span>{t.generate_btn}</span> →</button>
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

      {/* =================== PHASE: LOADING / ERROR =================== */}
      {phase === "loading" && (
        <section id="phase-loading">
          <div className="wrap">
            {error ? (
              <div className="load-card appear" style={{ textAlign: "center" }}>
                <h2>{isZh ? "生成失败" : "Generation failed"}</h2>
                <p className="sub">{isZh ? "网络或模型有点波动，再试一次通常就好。" : "A network or model hiccup — retrying usually works."}</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22 }}>
                  <button className="btn btn-primary btn-lg" onClick={runDiagnosis}>{isZh ? "重新生成" : "Retry"} →</button>
                  <button className="btn btn-ghost btn-lg" onClick={cancelDiagnosis}>{isZh ? "返回修改" : "Back"}</button>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </section>
      )}

      {/* =================== PHASE: REPORT =================== */}
      {phase === "report" && report && (
        <section id="phase-report">
          <div className="wrap">
            <div className="rep-bar">
              <div>
                <div className="eyebrow">{t.report_eyebrow}</div>
                <h1>{t.report_title}</h1>
                <div className="rep-meta">
                  <span>{methodNote}</span><span>·</span>
                  <span>{sourceTag}</span>
                </div>
              </div>
              <div className="btns" style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={backToInput}>← <span>{t.edit_btn}</span></button>
                <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>{t.export_btn}</button>
              </div>
            </div>

            {/* 总览 */}
            <div className={`card${shown ? " shown" : ""}`}>
              <div className="sum-grid">
                <div>
                  <div className="eyebrow" style={{ marginBottom: 2, color: "var(--mute)" }}>{t.overall_label}</div>
                  <div className="big-score"><b>{bigScore}</b><span>/100</span></div>
                  <div className="level"><i /><span>{report.level_tag}</span></div>
                  <p className="blurb">{report.summary}</p>
                  <div className="kpis">
                    <div className="kpi warn"><small>{t.kpi_findings}</small><b>{report.kpi.findings_count}</b><span>{t.items_unit}</span></div>
                    <div className="kpi ok"><small>{t.kpi_rewrites}</small><b>{report.kpi.rewrites_count}</b><span>{t.items_unit}</span></div>
                  </div>
                </div>
                <div className="sum-right">
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
                    {(() => {
                      const dots = radarDots(report.dimensions.map((d) => d.score));
                      return (
                        <>
                          <polygon className="shape" points={dots.map((d) => `${d.x},${d.y}`).join(" ")} />
                          {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="3.5" />)}
                        </>
                      );
                    })()}
                    {report.dimensions.slice(0, 5).map((d, i) => (
                      <text key={i} x={AXIS[i].x} y={AXIS[i].y} textAnchor="middle">{d.label}</text>
                    ))}
                  </svg>
                  <div className="dim-rows">
                    {report.dimensions.map((d, i) => {
                      const c = dimColor(d.score);
                      return (
                        <div className="dim-row" key={i}>
                          <div className="t"><b>{d.label}</b><span style={{ color: c }}>{d.score} <span style={{ color: "var(--faint)", fontWeight: 400 }}>/100</span></span></div>
                          <div className="bar"><i style={{ "--w": `${d.score}%`, background: c } as CSSProperties} /></div>
                          <div className="dim-note">{d.note}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 关键发现 */}
            <div className="sec-row">
              <h2><span className="num">02 · </span><span>{t.findings_title}</span></h2>
              <span className="right">{report.kpi.findings_count} <span>{t.findings_total_label}</span></span>
            </div>
            <div className="findings">
              {report.findings.map((f, i) => {
                const c = SEV_COLORS[SEV_KEY[f.severity] ?? "weak"];
                return (
                  <div className="finding" key={f.id ?? i}>
                    <div className="find-top"><span className="sev" style={{ color: c.fg, background: c.bg, borderColor: c.bd }}>{SEV_TEXT[lang][f.severity] ?? f.severity}</span><span>{f.dimension}</span></div>
                    <div className="basis"><b>{t.basis_label}</b> · {f.basis}</div>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                    <div className="fix"><b>{t.fix_label}</b>{f.suggestion}</div>
                    <div className="affected">{f.affected}</div>
                  </div>
                );
              })}
            </div>

            {/* 改写示例 */}
            <div className="sec-row">
              <h2><span className="num">03 · </span><span>{t.rewrites_title}</span></h2>
              <span className="right">
                {isZh ? `共 ${report.kpi.rewrites_count} 条 · 显示 ${report.rewrites.length}` : `${report.kpi.rewrites_count} total · showing ${report.rewrites.length}`}
              </span>
            </div>
            <div>
              {report.rewrites.map((rw, i) => (
                <div className="rw" key={rw.id ?? i}>
                  <div className="rw-head"><span className="id">{rw.id}</span><span className="sec">{rw.section}</span><span className="tag">{rw.tag}</span><span className="imp">{rw.improvement} ↑</span></div>
                  <div className="rw-grid">
                    <div className="rw-cell before"><small>{t.before_label}</small><p>{rw.before}</p><div className="mini-chips">{rw.issues.map((x, j) => <span className="mc-issue" key={j}>{x}</span>)}</div></div>
                    <div className="rw-cell after"><small>{t.after_label}</small><p>{rw.after}</p><div className="mini-chips">{rw.wins.map((x, j) => <span className="mc-win" key={j}>{x}</span>)}</div></div>
                  </div>
                </div>
              ))}
            </div>

            {/* JD 匹配 */}
            <div className="sec-row">
              <h2><span className="num">04 · </span><span>{isZh ? "JD 匹配分析" : "JD fit analysis"}</span></h2>
              <span className="right match-row"><span>{t.match_label}</span><b>{report.jd_match.overall}%</b></span>
            </div>
            <div className="buckets">
              {report.jd_match.buckets.map((b, i) => (
                <div className="bucket" key={i}>
                  <div className="bucket-h"><b>{b.title}</b><span>{b.hits}/{b.total}</span></div>
                  <div className="bk-chips">
                    {b.items.map((it, j) => {
                      const c = SEV_COLORS[STATUS_KEY[it.status] ?? "weak"];
                      return <span key={j} style={{ color: c.fg, background: c.bg, borderColor: c.bd }}>{it.label}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="recommend"><b>{t.recommend_label}</b><p>{report.jd_match.recommendation}</p></div>

            {/* 下一步 */}
            <div className="next">
              <div>
                <div className="eyebrow">{t.next_eyebrow}</div>
                <h2>{report.next_steps.title}</h2>
                <p>{report.next_steps.subtitle}</p>
              </div>
              <div className="next-btns">
                <a
                  className="btn btn-primary btn-lg"
                  href="/interview"
                  onClick={() => {
                    // 把简历 + JD 带进模拟面试（同源 sessionStorage；面试页据此调用真接口）。脱敏开则带掩码版
                    try { sessionStorage.setItem("om:interview:ctx", JSON.stringify({ resume: anon ? maskPII(resume) : resume, jd, lang })); } catch { /* noop */ }
                  }}
                ><span>{t.next_btn_primary}</span> →</a>
                <button className="btn btn-ghost btn-lg" onClick={backToInput}>{t.next_btn_secondary}</button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div id="toast" className={toastMsg ? "show" : ""} role="status">{toastMsg}</div>
    </>
  );
}
