"use client";

import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { REVIEW_I18N, REVIEW_COLORS, PREV_DIMS, type Lang } from "@/lib/review-i18n";
import "./review.css";

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
const OVERALL = 78; // demo 本场总分（真复盘接 /api/debrief 后来自数据）

export default function Review() {
  const [lang, setLang] = useState<Lang>("zh");
  const [toastMsg, setToastMsg] = useState("");
  const t = REVIEW_I18N[lang];
  const isZh = lang === "zh";

  useEffect(() => {
    document.documentElement.lang = isZh ? "zh-CN" : "en";
    document.title = isZh ? "OfferMate — 面试复盘报告" : "OfferMate — Interview debrief";
  }, [isZh]);

  function toast(msg: string) {
    setToastMsg(msg);
    window.clearTimeout((toast as unknown as { _t?: number })._t);
    (toast as unknown as { _t?: number })._t = window.setTimeout(() => setToastMsg(""), 2600);
  }

  const now = radarDots(t.dims.map((d) => d.score));
  const prev = radarDots(PREV_DIMS);
  const dimLabels = [t.dim_1, t.dim_2, t.dim_3, t.dim_4, t.dim_5];

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
                {t.meta.map((m, i) => (
                  <Fragment key={i}>{i > 0 && <span>·</span>}<span>{m}</span></Fragment>
                ))}
              </div>
            </div>
            <div className="btns" style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => toast(t.toast_msg)}>{t.transcript_btn}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>{t.export_btn}</button>
            </div>
          </div>

          {/* 总览：分数 + 增量 + 双雷达 */}
          <div className="card">
            <div className="sum-grid">
              <div>
                <div className="eyebrow" style={{ marginBottom: 2, color: "var(--mute)" }}>{t.overall_label}</div>
                <div className="big-score"><b>{OVERALL}</b><span>/100</span><span className="delta">{t.overall_delta}</span></div>
                <div className="level"><i /><span>{t.level_tag}</span></div>
                <p className="blurb">{t.summary}</p>
                <div className="kpis">
                  <div className="kpi warn"><small>{t.kpi_followups}</small><b>5</b><span>{t.kpi_followups_unit}</span></div>
                  <div className="kpi ok"><small>{t.kpi_highlights}</small><b>2</b><span>{t.kpi_highlights_unit}</span></div>
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
                      <polygon className="shape prev" points={prev.map((d) => `${d.x},${d.y}`).join(" ")} />
                      <polygon className="shape" points={now.map((d) => `${d.x},${d.y}`).join(" ")} />
                      {now.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="3.5" />)}
                      {dimLabels.map((label, i) => (
                        <text key={i} x={AXIS[i].x} y={AXIS[i].y} textAnchor="middle">{label}</text>
                      ))}
                    </svg>
                    <div className="radar-legend">
                      <span><i />{t.legend_now}</span>
                      <span className="prev"><i />{t.legend_prev}</span>
                    </div>
                  </div>
                  <div className="dim-rows">
                    {t.dims.map((d, i) => (
                      <div className="dim-row" key={i}>
                        <div className="t"><b>{d.label}</b><span style={{ color: d.c }}>{d.score} <span style={{ color: "var(--faint)", fontWeight: 400 }}>/100</span><span className="d">{d.delta}</span></span></div>
                        <div className="bar"><i style={{ "--w": `${d.score}%`, background: d.c } as CSSProperties} /></div>
                        <div className="dim-note">{d.note}</div>
                      </div>
                    ))}
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
            {t.moments.map((m, i) => {
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
            {t.upgrades.map((u, i) => (
              <div className="rw" key={i}>
                <div className="rw-head"><span className="id">{u.id}</span><span className="sec">{u.sec}</span><span className="tag">{u.tag}</span><span className="imp">{u.imp} ↑</span></div>
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
            {t.buckets.map((b, i) => {
              const c = REVIEW_COLORS[b.k] ?? REVIEW_COLORS.weak;
              return (
                <div className="bucket" key={i}>
                  <div className="bucket-h"><b>{b.title}</b><span>{b.meta}</span></div>
                  <div className="bk-chips">{b.items.map((it, j) => <span key={j} style={{ color: c.fg, background: c.bg, borderColor: c.bd }}>{it}</span>)}</div>
                </div>
              );
            })}
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
