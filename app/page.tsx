"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { LANDING_I18N, JD_COLORS, type Lang } from "@/lib/landing-i18n";
import "./landing.css";

// D3 才会建 /diagnose 路由；现在按钮先指向它（建好前点击会 404）。
const DIAGNOSE = "/diagnose";
const DIAGNOSE_SAMPLE = "/diagnose?sample=1";

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const t = LANDING_I18N[lang];

  // 语言切换时同步 <html lang>
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  // 滚动进场（与原型一致）
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".rv").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* 无 JS 时不隐藏内容 */}
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: ".rv{opacity:1!important;transform:none!important}" }} />
      </noscript>

      {/* =================== NAV =================== */}
      <nav>
        <div className="wrap nav-in">
          <a className="brand" href="#" aria-label="OfferMate">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
              <rect width="28" height="28" rx="7" fill="#1F1F1F" />
              <circle cx="13" cy="15" r="6.2" fill="none" stroke="#FFF" strokeWidth="1.6" />
              <path d="M 9.5 18.5 L 20 8 M 20 8 L 14.5 8 M 20 8 L 20 13.5" stroke="#E4F222" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>OfferMate</span>
          </a>
          <div className="nav-links">
            <a href="#features">{t.nav_features}</a>
            <a href="#pains">{t.nav_pains}</a>
            <a href="#pricing">{t.nav_pricing}</a>
            <a href="#partners">{t.nav_partners}</a>
          </div>
          <div className="spacer" />
          <div className="lang" role="group" aria-label="Language">
            <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中文</button>
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
          <a className="btn btn-primary btn-sm" href={DIAGNOSE}>{t.nav_cta}</a>
        </div>
      </nav>

      {/* =================== HERO =================== */}
      <section className="wrap hero">
        <div className="rv">
          <span className="badge"><i /><span>{t.hero_badge}</span></span>
          <h1>
            <span>{t.hero_title_a}</span><br />
            <span>{t.hero_title_b}</span>
            <span className="accent">
              <span>{t.hero_title_accent}</span>
              <svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M4 9 C 60 13, 140 3, 196 8" /></svg>
            </span>
            <span>{t.hero_title_c}</span>
          </h1>
          <p className="hero-sub">{t.hero_sub}</p>
          <div className="hero-ctas">
            <a className="btn btn-primary btn-lg" href={DIAGNOSE}><span>{t.hero_cta_primary}</span> →</a>
            <a className="btn btn-ghost btn-lg" href={DIAGNOSE_SAMPLE}>{t.hero_cta_secondary}</a>
          </div>
          <div className="hero-meta">
            <span>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" stroke="#1F1F1F" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>{t.hero_meta_1}</span>
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" stroke="#1F1F1F" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>{t.hero_meta_2}</span>
            </span>
          </div>
        </div>

        <div className="rv" style={{ transitionDelay: ".12s" }}>
          <div className="demo-card">
            <span className="corner">{t.sample_tag}</span>
            <div className="demo-head">
              <div>
                <div className="mock-label" style={{ marginBottom: 6 }}>{t.report_label}</div>
                <h3>{t.report_title}</h3>
                <p>{t.report_subtitle}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mock-label" style={{ marginBottom: 2 }}>{t.overall_label}</div>
                <div className="score"><b>86</b><span>/100</span></div>
              </div>
            </div>
            <div className="demo-body">
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
              <div className="dim-rows">
                {t.dim_rows.map((r, i) => (
                  <div className="dim-row" key={i}>
                    <div className="t"><b>{r.label}</b><span>{r.score}</span></div>
                    <div className="bar"><i style={{ "--w": `${r.score}%` } as CSSProperties} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="demo-foot">
              <span className="chip warn"><span>{t.tag_finding}</span> · 7</span>
              <span className="chip ok"><span>{t.tag_rewrite}</span> · 12</span>
              <a className="view-link" href={DIAGNOSE_SAMPLE}><span>{t.view_full}</span> →</a>
            </div>
          </div>
        </div>
      </section>

      {/* =================== 信任条 =================== */}
      <section className="trust">
        <div className="wrap trust-in">
          <span className="trust-label">{t.trust_label}</span>
          <div className="stat"><b>1222 万</b><span>{t.trust_1}</span></div>
          <div className="stat"><b>¥200–500</b><span>{t.trust_2}</span></div>
          <div className="stat"><b>1–2 周</b><span>{t.trust_3}</span></div>
          <div className="stat"><b>~47 s</b><span>{t.trust_4}</span></div>
        </div>
      </section>

      {/* =================== 痛点 =================== */}
      <section id="pains" className="wrap sec">
        <div className="sec-head rv">
          <div>
            <div className="eyebrow">{t.section_eyebrow_pains}</div>
            <h2>{t.pains_title}</h2>
          </div>
          <p>{t.pains_sub}</p>
        </div>
        <div className="pains-grid rv">
          {t.pains.map((p, i) => (
            <div className="pain" key={i}>
              <div className="pain-top"><span className="pain-num">{p.num}</span><span className="pain-tag">{p.tag}</span></div>
              <div><h3>{p.title}</h3><p>{p.body}</p></div>
              <div className="pain-stat">{p.stat}</div>
            </div>
          ))}
        </div>
      </section>

      {/* =================== 功能总头 =================== */}
      <section id="features" className="wrap sec" style={{ paddingBottom: 8 }}>
        <div className="rv">
          <div className="eyebrow">{t.section_eyebrow_features}</div>
          <h2 className="features-title">{t.features_title}</h2>
          <p className="features-sub">{t.features_sub}</p>
        </div>
      </section>

      {/* =================== F01 简历诊断 =================== */}
      <section className="wrap feat">
        <div className="feat-copy rv">
          <div className="eyebrow">{t.f1_tag}</div>
          <h3>{t.f1_title}</h3>
          <p className="sub">{t.f1_sub}</p>
          <p className="body">{t.f1_body}</p>
          <div className="feat-chips">{t.f1_chips.map((c, i) => <span key={i}>{c}</span>)}</div>
        </div>
        <div className="rv" style={{ transitionDelay: ".1s" }}>
          <div className="mock" style={{ marginRight: 30 }}>
            <div className="mock-label">{t.resume_section}</div>
            <div className="cv">
              <h4>{t.resume_role}</h4>
              <p className="meta">{t.resume_company}</p>
              <ul>
                <li><span className="hl">{t.bullet_1_bad}</span></li>
                <li>{t.bullet_2}</li>
                <li><span className="hl">{t.bullet_3_bad}</span></li>
              </ul>
            </div>
            <div className="note n1"><b><span>{t.comment_1_tag}</span> · 01</b><span>{t.comment_1}</span></div>
            <div className="note n2"><b><span>{t.comment_2_tag}</span> · 02</b><span>{t.comment_2}</span></div>
            <div className="rewrite"><b>{t.rewrite_label}</b><p>{t.bullet_1_good}</p></div>
          </div>
        </div>
      </section>

      {/* =================== F02 JD 匹配 =================== */}
      <section className="feat-alt">
        <div className="wrap feat flip">
          <div className="rv">
            <div className="match-wrap" style={{ marginTop: 14 }}>
              <div className="match-badge"><span>{t.match_label}</span><b>68%</b></div>
              <div className="mini">
                <div className="mock-label" style={{ marginBottom: 8 }}>{t.jd_label}</div>
                <h5>{t.jd_title}</h5>
                <div className="jd-items">
                  {t.jd_items.map((j, i) => {
                    const c = JD_COLORS[j.k];
                    return (
                      <div className="jd-it" key={i} style={{ background: c.bg, borderColor: c.bd, color: c.fg }}>
                        <i style={{ background: c.fg }} />{j.label}<span>{j.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mini">
                <div className="mock-label" style={{ marginBottom: 8 }}>{t.resume_label}</div>
                <h5>{t.resume_meta}</h5>
                <div className="cv-items">
                  {t.resume_items.map((it, i) => <div key={i}>{it}</div>)}
                </div>
              </div>
            </div>
          </div>
          <div className="feat-copy rv" style={{ transitionDelay: ".1s" }}>
            <div className="eyebrow">{t.f2_tag}</div>
            <h3>{t.f2_title}</h3>
            <p className="sub">{t.f2_sub}</p>
            <p className="body">{t.f2_body}</p>
            <div className="feat-chips">{t.f2_chips.map((c, i) => <span key={i}>{c}</span>)}</div>
          </div>
        </div>
      </section>

      {/* =================== F03 模拟面试 =================== */}
      <section className="wrap feat">
        <div className="feat-copy rv">
          <div className="eyebrow">{t.f3_tag}</div>
          <h3>{t.f3_title}</h3>
          <p className="sub">{t.f3_sub}</p>
          <p className="body">{t.f3_body}</p>
          <div className="feat-chips">{t.f3_chips.map((c, i) => <span key={i}>{c}</span>)}</div>
        </div>
        <div className="rv" style={{ transitionDelay: ".1s" }}>
          <div className="mock">
            <div className="chat-head">
              <div>
                <div className="mock-label" style={{ marginBottom: 4 }}>{t.interview_label}</div>
                <div className="q">{t.interview_q}</div>
              </div>
              <span className="pressure"><i /><span>{t.pressure_mode}</span></span>
            </div>
            <div className="msg ai"><span className="av">AI</span><div className="bubble">{t.chat_q1}</div></div>
            <div className="msg me"><span className="av">{t.you_initial}</span><div><div className="bubble">{t.chat_a1}</div><span className="flag">⚠ <span>{t.vague_flag}</span></span></div></div>
            <div className="msg ai"><span className="av">AI</span><div><span className="fu-tag">{t.followup_tag}</span><div className="bubble">{t.chat_q2}</div></div></div>
            <div className="msg me"><span className="av">{t.you_initial}</span><span className="typing"><i /><i /><i /></span></div>
            <div className="depth"><span>{t.depth_label}</span><span><b>L2</b> / L3 · Q3 / 8</span></div>
          </div>
        </div>
      </section>

      {/* =================== CTA =================== */}
      <section id="pricing" className="wrap cta">
        <div className="cta-panel rv">
          <svg className="cta-bg" width="360" height="360" viewBox="0 0 320 320" aria-hidden="true">
            <polygon className="grid" points="160,50 264.62,126.01 224.68,248.99 95.32,248.99 55.38,126.01" fill="none" strokeWidth="1" />
            <polygon className="grid" points="160,105 212.31,143 192.34,204.5 127.66,204.5 107.69,143" fill="none" strokeWidth="1" />
            <polygon className="shape" points="160,74.2 245.77,132.13 205.92,223.18 105.02,235.64 80.5,134.17" strokeWidth="1.5" />
          </svg>
          <div className="eyebrow">{t.cta_eyebrow}</div>
          <h2>{t.cta_title}</h2>
          <p>{t.cta_sub}</p>
          <div className="hero-ctas">
            <a className="btn btn-primary btn-lg" href={DIAGNOSE}><span>{t.cta_btn_primary}</span> →</a>
            <a className="btn btn-ghost btn-lg" href={DIAGNOSE_SAMPLE}>{t.cta_btn_secondary}</a>
          </div>
          <div className="cta-meta">
            <span>✓ <span>{t.cta_meta_1}</span></span>
            <span>✓ <span>{t.cta_meta_2}</span></span>
            <span>✓ <span>{t.cta_meta_3}</span></span>
          </div>
        </div>
      </section>

      {/* =================== FOOTER =================== */}
      <footer id="partners">
        <div className="wrap foot-in">
          <div>
            <a className="brand" href="#">
              <svg width="26" height="26" viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="7" fill="#1F1F1F" /><circle cx="13" cy="15" r="6.2" fill="none" stroke="#FFF" strokeWidth="1.6" /><path d="M 9.5 18.5 L 20 8 M 20 8 L 14.5 8 M 20 8 L 20 13.5" stroke="#E4F222" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>OfferMate</span>
            </a>
            <p className="tag">{t.footer_tagline}</p>
            <p className="mail">hi@offermate.example</p>
          </div>
          {t.footer_cols.map((col, i) => (
            <div className="fcol" key={i}>
              <h5>{col.title}</h5>
              {col.items.map((it, j) => <a href="#" key={j}>{it}</a>)}
            </div>
          ))}
        </div>
        <div className="wrap foot-bar">
          <span>© 2026 OfferMate</span>
          <span className="status"><i /><span>{t.footer_status}</span></span>
        </div>
      </footer>
    </>
  );
}
