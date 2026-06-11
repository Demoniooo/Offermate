/* ============================================================
   OfferMate · 结构化评估 rubric（单一来源，双语 zh/en）
   把四类依据蒸馏成评估标准 + 三条透明度原则。

   用途：
   - 本轮：喂落地页「评估方法」区块（可信度护城河）；
   - D4–D5：作为 /api/diagnose 诊断提示词的依据来源（同一份内容注入 prompt）。

   产品原则（Idea Brief）：不让大模型凭感觉打分；AI 每次打分都必须
   说明「依据 / 扣分原因 / 可执行修改建议」。
   ============================================================ */

export type Lang = "zh" | "en";

export interface RubricSource {
  /** 稳定 key，finding.basis 可引用，D4–D5 prompt 也用 */
  key: "nace" | "employer" | "hm" | "jd";
  name: string;
  summary: string;
  points: string[];
}

export interface RubricPrinciple {
  label: string;
  desc: string;
}

export interface RubricDict {
  section: { eyebrow: string; title: string; sub: string };
  sources: RubricSource[];
  principles_title: string;
  principles: RubricPrinciple[];
}

export const RUBRIC: Record<Lang, RubricDict> = {
  zh: {
    section: {
      eyebrow: "评估方法 · 为什么可信",
      title: "不是 AI 凭感觉打分，是按结构化 rubric 打分。",
      sub: "我们把四类公认的求职评估依据，转化成可执行的评分标准。每一条扣分都能追溯到一条标准——而不是一句模糊的「再优化一下」。",
    },
    sources: [
      {
        key: "nace",
        name: "NACE 职业能力框架",
        summary: "美国全国大学与雇主协会的「职业准备度」八项核心能力，衡量简历是否呈现了雇主真正看重的能力证据。",
        points: ["沟通 · 团队协作 · 批判性思维", "领导力 · 专业素养 · 技术运用", "职业与自我发展 · 公平与包容"],
      },
      {
        key: "employer",
        name: "雇主简历偏好调查",
        summary: "基于 NACE Job Outlook 等雇主调研：HR 在简历上最先找什么，以此校准每个维度的权重。",
        points: ["量化成果优先于职责罗列", "问题解决 / 分析能力 / 主动性", "相关经历与可证明的影响"],
      },
      {
        key: "hm",
        name: "Harvard & MIT 简历规范",
        summary: "两校就业中心的简历写作标准，落到每个 bullet 的可操作规则。",
        points: ["强动词开头，去掉「负责 / 协助」", "量化结果：数字 / 百分比 / 规模", "Action–Context–Result，结果前置"],
      },
      {
        key: "jd",
        name: "岗位技能数据库",
        summary: "把目标岗位 JD 拆成硬技能、软偏好、隐性关键词，逐项比对简历覆盖度。",
        points: ["硬技能命中 / 弱 / 缺失", "软性信号与跨部门协作", "JD 字面没写、但 HR 会加分的隐性词"],
      },
    ],
    principles_title: "每一次打分，都给你三样东西",
    principles: [
      { label: "依据", desc: "指明这一条命中的是哪条 rubric 标准——可追溯，不是黑箱。" },
      { label: "扣分原因", desc: "引用你简历里的原文，说清为什么扣分、影响了哪几条经历。" },
      { label: "可执行修改建议", desc: "给出带数字的具体改写，照着改就能加分，而不是「再具体些」。" },
    ],
  },
  en: {
    section: {
      eyebrow: "Methodology · Why trust it",
      title: "Not vibes — scored against a structured rubric.",
      sub: "We turn four recognized career-evaluation sources into actionable scoring criteria. Every deduction traces back to a standard — not a vague \"make it better\".",
    },
    sources: [
      {
        key: "nace",
        name: "NACE Career Readiness",
        summary: "The eight core competencies from the National Association of Colleges and Employers — does your resume show evidence of what employers actually value?",
        points: ["Communication · Teamwork · Critical thinking", "Leadership · Professionalism · Technology", "Career & self-development · Equity & inclusion"],
      },
      {
        key: "employer",
        name: "Employer resume surveys",
        summary: "Based on NACE Job Outlook and similar employer research: what recruiters scan for first — used to weight each dimension.",
        points: ["Quantified outcomes over duty lists", "Problem-solving / analytics / initiative", "Relevant experience with provable impact"],
      },
      {
        key: "hm",
        name: "Harvard & MIT standards",
        summary: "The resume-writing standards from both schools' career offices, applied down to each bullet.",
        points: ["Lead with strong verbs, drop \"responsible/assisted\"", "Quantify results: numbers / % / scale", "Action–Context–Result, results first"],
      },
      {
        key: "jd",
        name: "Job-skills database",
        summary: "We split the target JD into hard skills, soft signals and hidden keywords, then check resume coverage item by item.",
        points: ["Hard skills hit / weak / missing", "Soft signals & cross-team work", "Hidden keywords the JD implies but HR rewards"],
      },
    ],
    principles_title: "Every score gives you three things",
    principles: [
      { label: "Basis", desc: "Which rubric standard this maps to — traceable, not a black box." },
      { label: "Why deducted", desc: "Quotes your own resume text, states why points were lost and which bullets it affects." },
      { label: "Actionable fix", desc: "A concrete rewrite with numbers you can apply to gain points — not \"be more specific\"." },
    ],
  },
};
