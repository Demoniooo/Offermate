/* ============================================================
   OfferMate · 诊断提示词（D5）
   把 lib/rubric.ts 的结构化 rubric 注入提示词，约束模型按 rubric 打分，
   并强制输出严格 JSON（DiagnosisReport），每条发现必须给 依据/扣分原因/可执行建议。
   关键：提供「一个完整输出示例」，模型对照示例的结构远比对照抽象 schema 可靠。
   ============================================================ */

import { RESUME_RUBRIC, type Lang } from "./rubric";

/** 固定五维标签（保证雷达图 5 轴一致） */
export const DIMENSION_LABELS: Record<Lang, [string, string, string, string, string]> = {
  zh: ["表达", "逻辑", "岗位匹配", "案例质量", "STAR 结构"],
  en: ["Clarity", "Logic", "JD Fit", "Examples", "STAR structure"],
};

/** 一个合法返回的完整示例（缩略版，结构完整）——强约束模型按此结构输出 */
const EXAMPLE: Record<Lang, unknown> = {
  zh: {
    overall_score: 82,
    level_tag: "良好 · 距离 90 还差几处改动",
    summary: "结构清晰、案例可用；主要扣分在表达与岗位匹配——动词偏弱、结果缺数字、硬技能未体现。",
    dimensions: [
      { label: "表达", score: 78, note: "动词偏弱，可量化空间大" },
      { label: "逻辑", score: 82, note: "时间线、因果清楚" },
      { label: "岗位匹配", score: 71, note: "SQL 未体现" },
      { label: "案例质量", score: 85, note: "选材好" },
      { label: "STAR 结构", score: 76, note: "Result 常省略" },
    ],
    kpi: { findings_count: 5, rewrites_count: 8 },
    findings: [
      { id: "F-01", severity: "高", dimension: "表达", basis: "Harvard·MIT 规范 · 强动词开头/量化结果", title: "「负责/协助」过多，看不出贡献", body: "「负责日常运营工作」没说明你具体做了什么", suggestion: "改为「主导 N 场新人引导活动，通过 A/B 测试优化文案，使 7 日留存提升 X%（替换为你的真实数据）」", affected: "影响 3 条经历" },
      { id: "F-02", severity: "中", dimension: "岗位匹配", basis: "岗位技能库 · 硬技能缺口", title: "JD 要求的 SQL 未出现", body: "JD 点名 SQL，简历完全没提", suggestion: "补一句「用 SQL 清洗约 X 万条数据，产出 N 张监控看板（替换为你的真实数据）」", affected: "匹配度 -14 分" },
    ],
    rewrites: [
      { id: "R-01", section: "实习 · 互联网公司", tag: "运营实习生", improvement: "+18 分", before: "负责日常运营工作，协助团队完成各项任务", after: "主导 N 场新人引导活动（日均触达约 X 名用户），通过 A/B 测试优化文案，使 7 日留存提升 Y%（替换为你的真实数据）", issues: ["动词无力", "无结果"], wins: ["量化结果", "方法学"] },
    ],
    jd_match: {
      overall: 68,
      buckets: [
        { title: "硬性能力", hits: 2, total: 4, items: [{ label: "数据分析", status: "命中" }, { label: "SQL", status: "缺失" }] },
        { title: "软性偏好", hits: 2, total: 3, items: [{ label: "沟通能力", status: "命中" }, { label: "抗压能力", status: "弱" }] },
        { title: "隐性关键词", hits: 1, total: 3, items: [{ label: "运营 SOP", status: "缺失" }, { label: "社区运营", status: "命中" }] },
      ],
      recommendation: "优先补 SQL 与数据看板，把已有运营经历往「数据 / 实验」方向重写。",
    },
  },
  en: {
    overall_score: 82,
    level_tag: "Good · a few fixes from 90",
    summary: "Structure and examples are solid; most points lost on clarity and JD fit — weak verbs, no numbers, hard skills not shown.",
    dimensions: [
      { label: "Clarity", score: 78, note: "Weak verbs, easy quant wins" },
      { label: "Logic", score: 82, note: "Timeline and cause are clear" },
      { label: "JD Fit", score: 71, note: "SQL not shown" },
      { label: "Examples", score: 85, note: "Good picks" },
      { label: "STAR structure", score: 76, note: "Result often omitted" },
    ],
    kpi: { findings_count: 5, rewrites_count: 8 },
    findings: [
      { id: "F-01", severity: "高", dimension: "Clarity", basis: "Harvard·MIT · strong verbs/quantify", title: "Too many \"responsible/assisted\"", body: "\"Responsible for daily operations\" hides what you did", suggestion: "Rewrite as \"Led N onboarding events; A/B-tested copy to lift 7-day retention by X% (replace with your real numbers)\"", affected: "Affects 3 bullets" },
      { id: "F-02", severity: "中", dimension: "JD Fit", basis: "Job-skills DB · hard-skill gap", title: "SQL required by JD is missing", body: "The JD names SQL; the resume never mentions it", suggestion: "Add \"Used SQL to clean ~X rows and built N dashboards (replace with your real numbers)\"", affected: "Match -14 pts" },
    ],
    rewrites: [
      { id: "R-01", section: "Intern · Internet Co.", tag: "Ops intern", improvement: "+18 pts", before: "Responsible for daily operations, assisted team with various tasks", after: "Led N onboarding events (~X DAU reach); A/B-tested copy to lift 7-day retention by Y% (replace with your real numbers)", issues: ["Weak verbs", "No result"], wins: ["Quantified", "Methodology"] },
    ],
    jd_match: {
      overall: 68,
      buckets: [
        { title: "Hard skills", hits: 2, total: 4, items: [{ label: "Data analysis", status: "命中" }, { label: "SQL", status: "缺失" }] },
        { title: "Soft signals", hits: 2, total: 3, items: [{ label: "Communication", status: "命中" }, { label: "Resilience", status: "弱" }] },
        { title: "Hidden keywords", hits: 1, total: 3, items: [{ label: "Ops SOP", status: "缺失" }, { label: "Community ops", status: "命中" }] },
      ],
      recommendation: "Add SQL and dashboards first; reframe existing ops work around data / experiments.",
    },
  },
};

function rubricText(lang: Lang): string {
  const r = RESUME_RUBRIC[lang];
  const crit = lang === "zh" ? "评分细则" : "Criteria";
  // 关键：把每类来源的 points（可操作评分细则）+ 真实出处也注入，basis 才可追溯
  const sources = r.sources
    .map((s) => {
      const cite = s.source ? `（出处：${s.source.label}）` : "";
      return `- ${s.name}${cite}：${s.summary}\n  ${crit}：${s.points.map((p) => `「${p}」`).join("；")}`;
    })
    .join("\n");
  const principles = r.principles.map((p) => `- ${p.label}：${p.desc}`).join("\n");
  return `评估依据（已转化为结构化 rubric，必须据此打分，不得凭感觉）：\n${sources}\n\n每条发现必须同时给出：\n${principles}`;
}

export function buildDiagnosisMessages(resume: string, jd: string | undefined, lang: Lang) {
  const isZh = lang === "zh";
  const dims = DIMENSION_LABELS[lang].map((d) => `"${d}"`).join(", ");

  const rules = isZh
    ? `严格要求：
- 只输出一个 JSON 对象，不要任何解释、不要 markdown 代码块。
- 顶层字段必须且只能是：overall_score, level_tag, summary, dimensions, kpi, findings, rewrites, jd_match。不得新增/改名字段。
- dimensions 必须恰好 5 项，label 依次为 ${dims}。
- findings 产出 3-6 条；rewrites 产出 3 条；jd_match.buckets 恰好 3 桶（硬性能力 / 软性偏好 / 隐性关键词）。
- severity 只用 "高"/"中"/"低"；jd_match 里 status 只用 "命中"/"弱"/"缺失"。
- 每条 finding：basis 必须引用上述四类 rubric 之一并写明命中哪条细则；body=扣分原因并引用简历原文片段；suggestion=可直接照抄的改写。
- 【禁止编造数字】改写(after)与建议(suggestion)里的数字只能来自简历原文。简历里没有的数字，一律用「X%」「N 场」「↑XX」这类占位符，并在该句末尾加「（替换为你的真实数据）」，绝不编造具体数值。
- 【禁止套用示例】示例只用于约束 JSON 结构；不得把示例中的公司、岗位、活动或数字（如「字节」「7 日留存 +11%」「2.4k」）出现在你的输出里。
- 所有文本字段用简体中文。未提供 JD 时，从简历推断最可能岗位再做 jd_match。`
    : `Strict requirements:
- Output exactly ONE JSON object. No prose, no markdown fences.
- Top-level keys must be exactly: overall_score, level_tag, summary, dimensions, kpi, findings, rewrites, jd_match. Do not add or rename keys.
- dimensions: exactly 5, labels in order ${dims}.
- findings: 3-6 items; rewrites: 3 items; jd_match.buckets: exactly 3 (Hard skills / Soft signals / Hidden keywords).
- severity uses only "高"/"中"/"低"; jd_match item status uses only "命中"/"弱"/"缺失".
- Each finding: basis MUST cite one of the four rubric sources above and name the specific criterion; body = reason quoting the resume; suggestion = copy-paste-ready rewrite.
- [NO FABRICATED NUMBERS] Numbers in after/suggestion may only come from the resume itself. For any number not in the resume, use placeholders like "X%", "N events", "↑XX" and append "(replace with your real numbers)"; never invent specific figures.
- [DO NOT REUSE THE EXAMPLE] The example only constrains JSON structure; never let its companies, roles, activities or numbers (e.g. "ByteDance", "+11% 7-day retention", "2.4k") appear in your output.
- All text fields in English. If no JD is given, infer the most likely role from the resume, then do jd_match.`;

  const example = JSON.stringify(EXAMPLE[lang]);
  const jdBlock = jd && jd.trim() ? `\n\n=== JD ===\n${jd.trim()}` : "";

  // system 只放角色 + rubric + 强约束；schema/示例放进 user（模型对 user 最后指令服从度最高）
  const system = [
    isZh
      ? "你是一名严格、经验丰富的校招 HR 兼简历评估专家。你永远只返回一个合法 JSON 对象，不输出任何其它文字。"
      : "You are a strict, experienced campus-recruiting HR and resume evaluator. You ALWAYS return a single valid JSON object and nothing else.",
    rubricText(lang),
  ].join("\n\n");

  const user = [
    isZh ? "诊断下面这份简历，按上述 rubric 打分。" : "Diagnose the resume below, scoring by the rubric above.",
    (isZh
      ? "只输出一个 JSON 对象，键名与嵌套必须和下面这个示例完全一致，只替换内容（不要新增、删除或改名任何键）："
      : "Output exactly ONE JSON object whose keys and nesting match this example precisely; replace only the content (never add, drop or rename keys):") + "\n" + example,
    rules,
    `=== ${isZh ? "简历" : "Resume"} ===\n${resume.trim()}${jdBlock}`,
    isZh ? "现在直接输出该简历对应的 JSON（必须以 { 开头、以 } 结尾）：" : "Now output the JSON for this resume (must start with { and end with }):",
  ].join("\n\n");

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}
