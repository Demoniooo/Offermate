/* ============================================================
   OfferMate · 结构化评估 rubric（已联网核实文献 + 出处，2026-06）
   两套独立标准 —— 简历是"评写出来的文档"，面试是"评现场口头表达"，
   规则常常相反（例：简历不用人称代词 / 面试要用「我」），不可混用。

   - RESUME_RUBRIC    简历诊断打分依据（NACE / 雇主偏好 / Harvard·MIT 简历规范 / 岗位技能库）
   - INTERVIEW_RUBRIC 模拟面试复盘依据（STAR / 结构化面试研究 / 大厂能力框架 / NACE 共享）

   每个来源带真实 source（标题 + URL），喂提示词做可追溯的 basis，也在落地页可点。
   ============================================================ */

export type Lang = "zh" | "en";

export interface RubricSource {
  key: string;
  name: string;
  summary: string;
  points: string[];
  /** 真实出处（标题 + 链接）；岗位技能库这类自有方法可缺省 */
  source?: { label: string; url: string };
}

export interface RubricPrinciple {
  label: string;
  desc: string;
}

export interface TaskRubric {
  section: { eyebrow: string; title: string; sub: string };
  sources: RubricSource[];
  principles_title: string;
  principles: RubricPrinciple[];
}

/* ============================================================
   简历诊断 rubric
   ============================================================ */
export const RESUME_RUBRIC: Record<Lang, TaskRubric> = {
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
        source: { label: "NACE《Career Readiness Competencies》（2024 修订）", url: "https://www.naceweb.org/career-readiness/competencies" },
      },
      {
        key: "employer",
        name: "雇主简历偏好调查",
        summary: "NACE Job Outlook 雇主调研：HR 在简历上最先找什么——用真实比例校准每个维度的权重。",
        points: ["约 90% 雇主在简历上找『问题解决能力』的证据", "约 80% 找『团队协作』", "超 2/3 找沟通、灵活/适应力、分析/量化能力"],
        source: { label: "NACE《Job Outlook 2025》· 雇主最看重的简历属性", url: "https://www.naceweb.org/talent-acquisition/candidate-selection/the-key-attributes-employers-are-looking-for-on-graduates-resumes" },
      },
      {
        key: "hm",
        name: "Harvard & MIT 简历规范",
        summary: "两校就业中心的简历写作标准，落到每个 bullet 的可操作规则。",
        points: ["强动词开头，删掉「负责 / responsible for / duties」", "量化结果：数字 / 百分比 / 规模", "PAR：Project–Action–Result，结果导向", "不用人称代词（I/me），写成就而非职责"],
        source: { label: "Harvard MCS《Create a Strong Resume》 · MIT CAPD《Crafting an Effective Resume》", url: "https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/" },
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
      { label: "可执行修改建议", desc: "给出带占位符的具体改写，照着填真实数字就能加分，而不是「再具体些」。" },
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
        summary: "The eight core competencies from the National Association of Colleges and Employers — does your resume show evidence of what employers value?",
        points: ["Communication · Teamwork · Critical thinking", "Leadership · Professionalism · Technology", "Career & self-development · Equity & inclusion"],
        source: { label: "NACE Career Readiness Competencies (2024)", url: "https://www.naceweb.org/career-readiness/competencies" },
      },
      {
        key: "employer",
        name: "Employer resume surveys",
        summary: "NACE Job Outlook employer research — what recruiters scan for first, used to weight each dimension with real figures.",
        points: ["~90% of employers seek evidence of problem-solving", "~80% seek teamwork", ">2/3 seek communication, flexibility, analytical/quantitative skills"],
        source: { label: "NACE Job Outlook 2025 — Key Attributes on Resumes", url: "https://www.naceweb.org/talent-acquisition/candidate-selection/the-key-attributes-employers-are-looking-for-on-graduates-resumes" },
      },
      {
        key: "hm",
        name: "Harvard & MIT standards",
        summary: "The resume-writing standards from both schools' career offices, applied down to each bullet.",
        points: ["Lead with strong verbs, drop \"responsible for / duties\"", "Quantify results: numbers / % / scale", "PAR: Project–Action–Result, results-oriented", "No personal pronouns (I/me); accomplishments over duties"],
        source: { label: "Harvard MCS \"Create a Strong Resume\" · MIT CAPD \"Crafting an Effective Resume\"", url: "https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/" },
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
      { label: "Actionable fix", desc: "A concrete rewrite with placeholders to fill with your real numbers — not \"be more specific\"." },
    ],
  },
};

/* ============================================================
   模拟面试复盘 rubric（D8 复盘用；NACE 与简历共享，其余各异）
   ============================================================ */
export const INTERVIEW_RUBRIC: Record<Lang, TaskRubric> = {
  zh: {
    section: {
      eyebrow: "复盘方法 · 为什么可信",
      title: "面试不是凭感觉评，是按行为面试标准评。",
      sub: "复盘对照 STAR 框架、结构化面试研究和大厂真实评估标准——每条点评都能追溯到一条依据。",
    },
    sources: [
      {
        key: "star",
        name: "STAR 行为答题框架",
        summary: "MIT / Yale 就业中心的行为面试标准：一个好答案该有的结构。",
        points: ["Situation 20% / Task 10% / Action 60% / Result 10%", "用「我」体现个人贡献（与简历规则相反）", "Result 必须量化"],
        source: { label: "MIT CAPD《STAR Method》 · Yale OCS《The Behavioral Interview》", url: "https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/" },
      },
      {
        key: "structured",
        name: "结构化 / 行为面试研究",
        summary: "Google re:Work：为什么「追问具体证据」是有效的面试方法。",
        points: ["过去行为预测未来表现", "结构化面试比非结构化更有预测力", "答得空泛 → 追问探具体证据（这就是我们追问机制的依据）"],
        source: { label: "Google re:Work《Structured Interviewing》", url: "https://rework.withgoogle.com/intl/en/guides/a-guide-to-structured-interviewing-for-better-hiring-practices" },
      },
      {
        key: "employer_iv",
        name: "大厂面试框架（Amazon）",
        summary: "行为题对照岗位能力维度、追问要数据——大厂真实做法。",
        points: ["行为题对照岗位能力（Leadership Principles 式）", "答案要带指标 / 数据", "考察 what / how / why，而非脑筋急转弯"],
        source: { label: "Amazon《How We Hire · Interview Loop / STAR》", url: "https://amazon.jobs/content/en/how-we-hire/interview-loop" },
      },
      {
        key: "nace_iv",
        name: "NACE 职业能力（共享地基）",
        summary: "把沟通 / 批判性思维 / 团队协作落到「口头表达」而非纸面。",
        points: ["沟通：清晰、有条理地口头表达", "批判性思维：临场逻辑与判断", "团队协作：讲清个人在团队中的具体贡献"],
        source: { label: "NACE《Career Readiness Competencies》", url: "https://www.naceweb.org/career-readiness/competencies" },
      },
    ],
    principles_title: "每条点评，都给你三样东西",
    principles: [
      { label: "依据", desc: "命中哪条面试标准（STAR / 结构化面试 / 岗位能力）。" },
      { label: "问题", desc: "你的回答缺了什么——缺数字 / 缺方法 / 缺对照。" },
      { label: "更好的回答", desc: "给一版可照着练的改进回答（带 STAR 结构）。" },
    ],
  },
  en: {
    section: {
      eyebrow: "Debrief method · Why trust it",
      title: "Interviews scored by behavioral-interview standards, not vibes.",
      sub: "The debrief is measured against the STAR framework, structured-interview research and how top employers actually evaluate — every note traces back to a source.",
    },
    sources: [
      {
        key: "star",
        name: "STAR answer framework",
        summary: "The behavioral-interview standard from MIT / Yale career offices: what a strong answer looks like.",
        points: ["Situation 20% / Task 10% / Action 60% / Result 10%", "Use \"I\" to show your contribution (opposite of the resume rule)", "Quantify the Result"],
        source: { label: "MIT CAPD \"STAR Method\" · Yale OCS \"The Behavioral Interview\"", url: "https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/" },
      },
      {
        key: "structured",
        name: "Structured / behavioral interview research",
        summary: "Google re:Work: why probing for specific evidence actually works.",
        points: ["Past behavior predicts future performance", "Structured interviews are more predictive than unstructured", "Vague answer → probe for specific evidence (the basis for our follow-up loop)"],
        source: { label: "Google re:Work \"Structured Interviewing\"", url: "https://rework.withgoogle.com/intl/en/guides/a-guide-to-structured-interviewing-for-better-hiring-practices" },
      },
      {
        key: "employer_iv",
        name: "Big-employer framework (Amazon)",
        summary: "Behavioral questions mapped to role competencies; probe for data — how top employers really run it.",
        points: ["Behavioral questions map to role competencies (Leadership Principles style)", "Answers should include metrics / data", "Probe what / how / why, not brain-teasers"],
        source: { label: "Amazon \"How We Hire · Interview Loop / STAR\"", url: "https://amazon.jobs/content/en/how-we-hire/interview-loop" },
      },
      {
        key: "nace_iv",
        name: "NACE competencies (shared)",
        summary: "Communication / critical thinking / teamwork applied to spoken answers, not on paper.",
        points: ["Communication: clear, structured verbal delivery", "Critical thinking: on-the-spot logic and judgement", "Teamwork: spell out your own contribution to the team"],
        source: { label: "NACE Career Readiness Competencies", url: "https://www.naceweb.org/career-readiness/competencies" },
      },
    ],
    principles_title: "Every note gives you three things",
    principles: [
      { label: "Basis", desc: "Which interview standard it maps to (STAR / structured interview / competency)." },
      { label: "Issue", desc: "What your answer lacked — no numbers / no method / no comparison." },
      { label: "Better answer", desc: "A practice-ready improved answer with STAR structure." },
    ],
  },
};
