"use client";

import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { REVIEW_I18N, REVIEW_COLORS, PREV_DIMS, type Lang } from "@/lib/review-i18n";
import { FEEDBACK_URL } from "@/lib/config";
import type { InterviewDebrief } from "@/lib/types";
import "./review.css";

const DEBRIEF_KEY = "om:interview:debrief";
const PREV_KEY = "om:interview:debrief:prev"; // 上一场维度分（同会话），有就画真实对比
const fmtDelta = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `${n}` : "±0");

// 雷达：五维分数 → 多边形顶点（中心 160,160 半径 110，正上方顺时针每 72°）
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
const MOCK_OVERALL = 78; // demo 本场总分（无真复盘时的演示数据）
const dimColor = (score: number) => (score >= 75 ? "#1F1F1F" : "#9A7A1A");
const MTAG: Record<Lang, Record<string, string>> = {
  zh: { hl: "高光", miss: "翻车", weak: "待改进" },
  en: { hl: "Highlight", miss: "Stumble", weak: "To fix" },
};

interface Vm {
  real: boolean;
  metaChips: string[];
  overall_score: number;
  overall_delta: string | null;
  level_tag: string;
  summary: string;
  kpi: { followups: number; highlights: number };
  followups_unit: string;
  highlights_unit: string;
  dims: { label: string; score: number; note: string; delta?: string }[];
  showPrev: boolean;
  prevDims: number[];
  moments: { kind: string; tag: string; dim: string; title: string; body: string; fix: string; affected: string }[];
  upgrades: { id: string; sec: string; tag: string; imp: string; before: string; after: string; issues: string[]; wins: string[] }[];
  buckets: { title: string; k: string; meta: string; items: string[] }[];
  recommendation: string;
}

export default function Review() {
  const [lang, setLang] = useState<Lang>("zh");
  const [toastMsg, setToastMsg] = useState("");
  const [debrief, setDebrief] = useState<InterviewDebrief | null>(null);
  const [prevSession, setPrevSession] = useState<{ dims: number[]; overall: number } | null>(null);
  const [booted, setBooted] = useState(false);
  const t = REVIEW_I18N[lang];
  const isZh = lang === "zh";

  useEffect(() => {
    document.documentElement.lang = isZh ? "zh-CN" : "en";
    document.title = isZh ? "OfferMate — 面试复盘报告" : "OfferMate — Interview debrief";
  }, [isZh]);

  // 读面试结束时存好的真复盘；没有就退回 mock 演示
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DEBRIEF_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.dimensions) && d.dimensions.length === 5) setDebrief(d);
      }
      const praw = sessionStorage.getItem(PREV_KEY);
      if (praw) {
        const p = JSON.parse(praw);
        if (p && Array.isArray(p.dims) && p.dims.length === 5) setPrevSession(p);
      }
    } catch { /* noop */ }
    setBooted(true);
  }, []);

  function toast(msg: string) {
    setToastMsg(msg);
    window.clearTimeout((toast as unknown as { _t?: number })._t);
    (toast as unknown as { _t?: number })._t = window.setTimeout(() => setToastMsg(""), 2600);
  }

  if (!booted) return <nav><div className="wrap nav-in" /></nav>;

  // 同会话里有上一场 → 画真实对比（真实路径才有的「再练对比提分」，无需数据库）
  const hasPrev = !!debrief && !!prevSession && prevSession.dims.length === 5;

  // ---------- 视图模型：真复盘 or mock 演示 ----------
  const vm: Vm = debrief
    ? {
        real: true,
        metaChips: [
          debrief.meta.role || (isZh ? "本场模拟面试" : "This mock interview"),
          isZh ? `${debrief.meta.questions} 题 · 被追问 ${debrief.kpi.followups} 次` : `${debrief.meta.questions} Qs · ${debrief.kpi.followups} follow-ups`,
          ...(debrief.meta.pressure ? [isZh ? "压力面 开启" : "Pressure ON"] : []),
          isZh ? (hasPrev ? "第 2+ 场 · 真实复盘" : "第 1 场 · 真实复盘") : (hasPrev ? "Session 2+ · live" : "Session 1 · live"),
        ],
        overall_score: debrief.overall_score,
        overall_delta: hasPrev ? (isZh ? `较上一场 ${fmtDelta(debrief.overall_score - prevSession!.overall)}` : `${fmtDelta(debrief.overall_score - prevSession!.overall)} vs last`) : null,
        level_tag: debrief.level_tag,
        summary: debrief.summary,
        kpi: debrief.kpi,
        followups_unit: isZh ? `次 / ${debrief.meta.questions} 题` : `of ${debrief.meta.questions} Qs`,
        highlights_unit: t.kpi_highlights_unit,
        dims: debrief.dimensions.map((d, i) => ({ label: d.label, score: d.score, note: d.note, delta: hasPrev ? fmtDelta(d.score - prevSession!.dims[i]) : undefined })),
        showPrev: hasPrev,
        prevDims: hasPrev ? prevSession!.dims : PREV_DIMS,
        moments: debrief.moments.map((m) => ({ ...m, tag: MTAG[lang][m.kind] ?? m.kind })),
        upgrades: debrief.upgrades.map((u) => ({ id: u.id, sec: u.section, tag: u.tag, imp: u.improvement, before: u.before, after: u.after, issues: u.issues, wins: u.wins })),
        buckets: debrief.buckets,
        recommendation: debrief.recommendation,
      }
    : {
        real: false,
        metaChips: t.meta,
        overall_score: MOCK_OVERALL,
        overall_delta: t.overall_delta,
        level_tag: t.level_tag,
        summary: t.summary,
        kpi: { followups: 5, highlights: 2 },
        followups_unit: t.kpi_followups_unit,
        highlights_unit: t.kpi_highlights_unit,
        dims: t.dims.map((d) => ({ label: d.label, score: d.score, note: d.note, delta: d.delta })),
        showPrev: true,
        prevDims: PREV_DIMS,
        moments: t.moments,
        upgrades: t.upgrades.map((u) => ({ id: u.id, sec: u.sec, tag: u.tag, imp: u.imp, before: u.before, after: u.after, issues: u.issues, wins: u.wins })),
        buckets: t.buckets,
        recommendation: t.recommend_body,
      };

  const now = radarDots(vm.dims.map((d) => d.score));
  const prev = radarDots(vm.prevDims);

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
            <span className="stp on"><i>✓</i><span>{t.step2}</span></span>
            <span className="stp-line" />
            <span className="stp on"><i>3</i><span>{t.step3}</span></span>
          </div>
          <div className="lang" role="group" aria-label="Language">
            <button className={isZh ? "on" : ""} onClick={() => setLang("zh")}>中文</button>
            <button className={!isZh ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
        </div>
      </nav>

      <section id="review">
        <div className="wrap">
          <div className="rep-bar">
            <div>
              <div className="eyebrow">{t.eyebrow}</div>
              <h1>{t.title}</h1>
              <div className="rep-meta">
                {vm.metaChips.map((m, i) => (
                  <Fragment key={i}>{i > 0 && <span>·</span>}<span>{m}</span></Fragment>
                ))}
              </div>
            </div>
            <div className="btns" style={{ display: "flex", gap: 8 }}>
              <a className="btn btn-primary btn-sm" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">{t.feedback_btn}</a>
              <button className="btn btn-ghost btn-sm" onClick={() => toast(t.toast_msg)}>{t.transcript_btn}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>{t.export_btn}</button>
            </div>
          </div>

          {/* 总览：分数 + 增量 + 雷达 */}
          <div className="card">
            <div className="sum-grid">
              <div>
                <div className="eyebrow" style={{ marginBottom: 2, color: "var(--mute)" }}>{t.overall_label}</div>
                <div className="big-score"><b>{vm.overall_score}</b><span>/100</span>{vm.overall_delta && <span className="delta">{vm.overall_delta}</span>}</div>
                <div className="level"><i /><span>{vm.level_tag}</span></div>
                <p className="blurb">{vm.summary}</p>
                <div className="kpis">
                  <div className="kpi warn"><small>{t.kpi_followups}</small><b>{vm.kpi.followups}</b><span>{vm.followups_unit}</span></div>
                  <div className="kpi ok"><small>{t.kpi_highlights}</small><b>{vm.kpi.highlights}</b><span>{vm.highlights_unit}</span></div>
                </div>
              </div>
              <div>
                <div className="sum-right">
                  <div>
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
                      {vm.showPrev && <polygon className="shape prev" points={prev.map((d) => `${d.x},${d.y}`).join(" ")} />}
                      <polygon className="shape" points={now.map((d) => `${d.x},${d.y}`).join(" ")} />
                      {now.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="3.5" />)}
                      {vm.dims.map((d, i) => (
                        <text key={i} x={AXIS[i].x} y={AXIS[i].y} textAnchor="middle">{d.label}</text>
                      ))}
                    </svg>
                    <div className="radar-legend">
                      <span><i />{t.legend_now}</span>
                      {vm.showPrev && <span className="prev"><i />{t.legend_prev}</span>}
                    </div>
                  </div>
                  <div className="dim-rows">
                    {vm.dims.map((d, i) => {
                      const c = dimColor(d.score);
                      return (
                        <div className="dim-row" key={i}>
                          <div className="t"><b>{d.label}</b><span style={{ color: c }}>{d.score} <span style={{ color: "var(--faint)", fontWeight: 400 }}>/100</span>{d.delta && <span className="d">{d.delta}</span>}</span></div>
                          <div className="bar"><i style={{ "--w": `${d.score}%`, background: c } as CSSProperties} /></div>
                          <div className="dim-note">{d.note}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 02 关键时刻 */}
          <div className="sec-row">
            <h2><span className="num">02 · </span><span>{t.moments_title}</span></h2>
            <span className="right">{t.moments_sub}</span>
          </div>
          <div className="findings">
            {vm.moments.map((m, i) => {
              const c = REVIEW_COLORS[m.kind] ?? REVIEW_COLORS.weak;
              return (
                <div className="finding" key={i}>
                  <div className="find-top"><span className="sev" style={{ color: c.fg, background: c.bg, borderColor: c.bd }}>{m.tag}</span><span>{m.dim}</span></div>
                  <h3>{m.title}</h3>
                  <p>{m.body}</p>
                  <div className="fix"><b>{t.do_label}</b>{m.fix}</div>
                  <div className="affected">{m.affected}</div>
                </div>
              );
            })}
          </div>

          {/* 03 话术升级 */}
          <div className="sec-row">
            <h2><span className="num">03 · </span><span>{t.upgrades_title}</span></h2>
            <span className="right">{t.upgrades_sub}</span>
          </div>
          <div>
            {vm.upgrades.map((u, i) => (
              <div className="rw" key={i}>
                <div className="rw-head"><span className="id">{u.id}</span><span className="sec">{u.sec}</span><span className="tag">{u.tag}</span>{u.imp && <span className="imp">{u.imp} ↑</span>}</div>
                <div className="rw-grid">
                  <div className="rw-cell before"><small>{t.before_label}</small><p>{u.before}</p><div className="mini-chips">{u.issues.map((x, j) => <span className="mc-issue" key={j}>{x}</span>)}</div></div>
                  <div className="rw-cell after"><small>{t.after_label}</small><p>{u.after}</p><div className="mini-chips">{u.wins.map((x, j) => <span className="mc-win" key={j}>{x}</span>)}</div></div>
                </div>
              </div>
            ))}
          </div>

          {/* 04 追问深度 */}
          <div className="sec-row">
            <h2><span className="num">04 · </span><span>{t.depth_title}</span></h2>
            <span className="right">{t.depth_sub}</span>
          </div>
          <div className="buckets">
            {vm.buckets.map((b, i) => {
              const c = REVIEW_COLORS[b.k] ?? REVIEW_COLORS.weak;
              return (
                <div className="bucket" key={i}>
                  <div className="bucket-h"><b>{b.title}</b><span>{b.meta}</span></div>
                  <div className="bk-chips">{b.items.map((it, j) => <span key={j} style={{ color: c.fg, background: c.bg, borderColor: c.bd }}>{it}</span>)}</div>
                </div>
              );
            })}
          </div>
          <div className="recommend"><b>{t.recommend_label}</b><p>{vm.recommendation}</p></div>

          {/* 下一步 */}
          <div className="next">
            <div>
              <div className="eyebrow">{t.next_eyebrow}</div>
              <h2>{t.next_title}</h2>
              <p>{t.next_sub}</p>
            </div>
            <div className="next-btns">
              <a className="btn btn-primary btn-lg" href="/interview"><span>{t.next_primary}</span> →</a>
              <a className="btn btn-ghost btn-lg" href="/diagnose">{t.next_secondary}</a>
            </div>
          </div>
        </div>
      </section>

      <div id="toast" className={toastMsg ? "show" : ""} role="status">{toastMsg}</div>
    </>
  );
}
