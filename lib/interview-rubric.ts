/* ============================================================
   OfferMate · 面试结构化评估 rubric（单一来源，双语 zh/en）
   简历看「写下来的声明」，面试看「被追问时撑不撑得住的口头证据」——
   思路与 lib/rubric.ts 一致（结构化、可追溯、给 依据/扣分原因/可执行建议），
   但依据来源与维度定义换成面试测评领域的权威文献。

   权威依据（已核实）：
   - 结构化面试效度第一：Sackett, Zhang, Berry & Lievens (2022), J. Applied Psychology 107, 2040–2068。
   - 面试结构的 15 要素（内容 + 评分两条路）：Campion, Palmer & Campion (1997), Personnel Psychology 50, 655–702。
   - STAR · 行为面试：DDI (1974) 提出 STAR；Janz (1982), JAP 67(5), 577–580 实证优于无结构面试。
   - 锚定评分量表（差/勉强/扎实/出色）：Google re:Work《结构化面试指南》。
   - 受评胜任力沿用 NACE Career Readiness（与简历 rubric 共享底层）。

   用途：
   - D13：作为 /api/debrief 复盘打分提示词的依据来源（同一份内容注入 prompt）；
   - 面试 / 复盘页「评估方法」区块的可信度护城河。
   ============================================================ */

import type { Lang } from "./rubric";

export interface InterviewRubricSource {
  /** 稳定 key，复盘 finding.basis 可引用，D13 prompt 也用 */
  key: "structured" | "star" | "probe" | "competency";
  name: string;
  summary: string;
  points: string[];
}

/** 五维（对齐 lib/review-i18n.ts 的维度标签），各维说明评什么、主要依据哪条 source */
export interface InterviewRubricDimension {
  label: string;
  assesses: string;
  basis: InterviewRubricSource["key"][];
}

export interface InterviewRubricPrinciple {
  label: string;
  desc: string;
}

export interface InterviewRubricDict {
  section: { eyebrow: string; title: string; sub: string };
  sources: InterviewRubricSource[];
  dimensions_title: string;
  dimensions: InterviewRubricDimension[];
  principles_title: string;
  principles: InterviewRubricPrinciple[];
}

export const INTERVIEW_RUBRIC: Record<Lang, InterviewRubricDict> = {
  zh: {
    section: {
      eyebrow: "面试评估方法 · 为什么可信",
      title: "面试不靠面感，按结构化 rubric 逐题打分。",
      sub: "我们把面试测评领域的权威依据，转成可执行的评分标准。每条评价都追溯到一条标准——结构化面试本就是预测工作表现最强的单一工具（Sackett 等, 2022）。",
    },
    sources: [
      {
        key: "structured",
        name: "结构化面试与锚定评分",
        summary:
          "在效度元分析中，结构化面试排第一，超过智力测验（Sackett, Zhang, Berry & Lievens, 2022）。关键是逐题、按面试前预设的锚定标准打分（Campion 等, 1997；Google re:Work）。",
        points: ["逐题独立评分，不靠整体印象", "每档分都有锚定示例：差 / 勉强 / 扎实 / 出色", "同一套标准评所有回答，可复用、可跨场对比"],
      },
      {
        key: "star",
        name: "STAR · 行为面试",
        summary:
          "行为面试以「过去行为预测未来行为」为前提，用 Situation–Task–Action–Result 拆解每个回答（DDI, 1974；Janz, 1982 实证优于无结构面试）。",
        points: ["S / T：情境与任务交代清楚", "A：本人具体动作（是「我」不是「我们」）", "R：可量化的结果与影响"],
      },
      {
        key: "probe",
        name: "追问探询 · 深度验证",
        summary:
          "结构化面试用追问逼出证据细节（Campion 等, 1997）。空泛回答就逐层追问口径、样本、对照；扛不住追问，说明证据不足或并非亲历。",
        points: ["缺数字 / 方法 / 对照即触发追问", "最多追问 3 层，看第几层才答实", "L2–L3 仍含糊 = 该项证据不成立"],
      },
      {
        key: "competency",
        name: "NACE 职业胜任力（现场展示）",
        summary: "受评能力沿用 NACE 职业准备度八项胜任力——但看能否通过口头举例当场证明，而非简历上的声明。",
        points: ["沟通 · 团队协作 · 批判性思维", "问题解决 · 专业素养 · 抗压", "岗位硬技能的真实使用场景，而非关键词"],
      },
    ],
    dimensions_title: "五个维度，各评一件事",
    dimensions: [
      { label: "表达", assesses: "口头表达是否清晰、先结论后展开、少口头禅（评说话，不评排版）", basis: ["structured"] },
      { label: "逻辑", assesses: "回答条理与 S→A→R 因果链是否连贯", basis: ["star"] },
      { label: "岗位匹配", assesses: "通过举例现场展示的胜任力与硬技能深度，而非关键词命中", basis: ["competency", "structured"] },
      { label: "案例质量", assesses: "STAR 完整度、是否本人贡献、结果是否量化", basis: ["star"] },
      { label: "追问应对", assesses: "被追问 2–3 层后能否给出口径 / 样本 / 对照——简历没有这一维", basis: ["probe"] },
    ],
    principles_title: "每一处评分，都给你三样东西",
    principles: [
      { label: "依据", desc: "指明命中的是哪条面试标准（STAR / 结构化 / 追问探询 / NACE 胜任力）——可追溯，不是黑箱。" },
      { label: "扣分原因", desc: "引用你在对话里的原话，说清哪里不够、卡在追问第几层。" },
      { label: "可执行修改建议", desc: "给一版「更好的说法」，照着 STAR 把缺的口径 / 动作 / 结果补上，而不是「再具体些」。" },
    ],
  },
  en: {
    section: {
      eyebrow: "Interview methodology · Why trust it",
      title: "Not gut feel — interviews scored question-by-question against a structured rubric.",
      sub: "We turn the authoritative interview-assessment literature into actionable scoring criteria. Every judgment traces to a standard — structured interviews are themselves the single strongest predictor of job performance (Sackett et al., 2022).",
    },
    sources: [
      {
        key: "structured",
        name: "Structured interviewing & anchored scoring",
        summary:
          "In validity meta-analyses, structured interviews rank first — above cognitive-ability tests (Sackett, Zhang, Berry & Lievens, 2022). The key is scoring each answer against anchors fixed before the interview (Campion et al., 1997; Google re:Work).",
        points: ["Score each answer on its own, not by overall impression", "Every band has an anchor: poor / borderline / solid / outstanding", "One rubric across all answers — reusable and comparable"],
      },
      {
        key: "star",
        name: "STAR · behavioral interviewing",
        summary:
          "Behavioral interviewing assumes past behavior predicts future behavior, decomposing each answer into Situation–Task–Action–Result (DDI, 1974; Janz, 1982 showed it beats unstructured interviews).",
        points: ["S / T: situation and task made clear", "A: the candidate's own actions (\"I\", not \"we\")", "R: quantified result and impact"],
      },
      {
        key: "probe",
        name: "Follow-up probing · depth check",
        summary:
          "Structured interviews probe for evidence detail (Campion et al., 1997). Vague answers get layered follow-ups on definition, sample and baseline; collapsing under probing signals thin or borrowed experience.",
        points: ["Missing number / method / baseline triggers a follow-up", "Up to 3 layers — which one finally lands?", "Still vague at L2–L3 = that claim doesn't hold"],
      },
      {
        key: "competency",
        name: "NACE competencies (shown live)",
        summary: "The competencies assessed follow NACE Career Readiness — but judged on whether the candidate can prove them through spoken examples, not assert them on paper.",
        points: ["Communication · teamwork · critical thinking", "Problem-solving · professionalism · resilience", "Real usage of role hard-skills, not keywords"],
      },
    ],
    dimensions_title: "Five dimensions, one thing each",
    dimensions: [
      { label: "Clarity", assesses: "Spoken clarity — conclusion first, few fillers (judges speech, not layout)", basis: ["structured"] },
      { label: "Logic", assesses: "Coherence and the S→A→R causal chain", basis: ["star"] },
      { label: "JD Fit", assesses: "Competencies and hard-skill depth shown through examples, not keyword hits", basis: ["competency", "structured"] },
      { label: "Examples", assesses: "STAR completeness, own contribution, quantified result", basis: ["star"] },
      { label: "Follow-up", assesses: "Whether definition / sample / baseline hold up after 2–3 follow-ups — a dimension resumes can't have", basis: ["probe"] },
    ],
    principles_title: "Every score gives you three things",
    principles: [
      { label: "Basis", desc: "Which interview standard it maps to (STAR / structured / probing / NACE) — traceable, not a black box." },
      { label: "Why deducted", desc: "Quotes your actual words, states what fell short and at which follow-up layer." },
      { label: "Actionable fix", desc: "A stronger version that completes the STAR — definition, action, result — not \"be more specific\"." },
    ],
  },
};
