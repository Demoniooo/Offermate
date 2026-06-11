/* D1 占位首页 —— 验证设计 token 生效；即任务 2 的「线上 Hello World」。
   落地页将在 D2 从 prototype/OfferMate Landing.dc.html 重写为 React。 */

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <svg width="36" height="36" viewBox="0 0 28 28" aria-hidden="true">
          <rect width="28" height="28" rx="7" fill="var(--dark)" />
          <circle cx="13" cy="15" r="6.2" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
          <path
            d="M 9.5 18.5 L 20 8 M 20 8 L 14.5 8 M 20 8 L 20 13.5"
            stroke="var(--primary-light)"
            strokeWidth="1.7"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
          OfferMate
        </span>
      </div>

      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          margin: 0,
        }}
      >
        D1 · 地基已就绪 / Foundation ready
      </p>

      <h1 style={{ fontSize: 30, fontWeight: 600, color: "var(--text-primary)", margin: 0, maxWidth: 560, lineHeight: 1.3 }}>
        60 秒生成 HR 视角的简历诊断
      </h1>

      <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0, maxWidth: 520, lineHeight: 1.6 }}>
        落地页与诊断流程开发中。设计 token、报告数据契约已定稿。
      </p>

      <span
        style={{
          marginTop: 8,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          borderRadius: "var(--radius-pill)",
          background: "var(--success-bg)",
          border: "1px solid var(--success-border)",
          color: "var(--success)",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        ● Hello World — 部署成功
      </span>
    </main>
  );
}
