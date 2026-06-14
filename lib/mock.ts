/* ============================================================
   OfferMate · 假报告（从原型 OfferMate Diagnosis.dc.html 抄的完整样例）
   用途：D3 报告骨架的数据源；联调前前端先吃这份 mock。
   它必须满足 DiagnosisReport 契约——改契约时这里会先报类型错。
   ============================================================ */

import type { DiagnosisReport } from "./types";
import type { Lang } from "./rubric";

const zh: DiagnosisReport = {
  overall_score: 86,
  level_tag: "良好 · 距离 90 还差 12 个改动",
  summary:
    "整体是一份选材不错、结构清楚的简历，离「能过初筛」只差临门一脚。最大的问题是动词偏弱、结果常被省略，导致 HR 看不出你的真实贡献；岗位匹配上，SQL 与实验方法学这两个硬要求没有体现。先把高优先级的 3 条经历按 STAR 量化改写，匹配度和说服力会同时上来。",

  dimensions: [
    { label: "表达", score: 78, note: "动词偏弱，可量化空间大" },
    { label: "逻辑", score: 82, note: "时间线、因果关系清楚" },
    { label: "岗位匹配", score: 71, note: "SQL 与实验方法学未体现" },
    { label: "案例质量", score: 85, note: "选材好，故事尚可挖深" },
    { label: "STAR 结构", score: 76, note: "Result 经常省略" },
  ],

  kpi: { findings_count: 3, rewrites_count: 3 },

  findings: [
    {
      id: "F-01",
      severity: "高",
      dimension: "表达",
      basis: "Harvard·MIT 规范 · 强动词 / 成就导向",
      title: "「负责 / 协助」出现 6 次，等于没写",
      body: "看不出你「做了什么」。每一条都换成可量化、可观察的动作：主导 / 设计 / 拆解 / 上线 / A/B 测试……",
      suggestion: "把每条「负责/协助」换成强动词 + 一个量化结果，例：「主导 3 场新人引导活动，7 日留存 +11%」。",
      affected: "影响 3 条经历",
    },
    {
      id: "F-02",
      severity: "中",
      dimension: "岗位匹配",
      basis: "岗位技能库 · 硬技能缺口",
      title: "SQL 与 A/B 实验方法学只字未提",
      body: "JD 把「数据分析 + 实验」列为硬性要求，但简历里看不到 SQL、看不到实验设计与显著性判断。哪怕只在一段经历里补一句，匹配度就能回来一截。",
      suggestion: "补一条数据课程/项目，写明用 SQL 做了什么、产出了哪张看板，把 JD 点名的硬技能落到纸面。",
      affected: "匹配度 -14 分",
    },
    {
      id: "F-03",
      severity: "中",
      dimension: "STAR · 结构",
      basis: "雇主偏好 · 量化成果 + 结果前置",
      title: "Result 经常被省略，故事只讲了一半",
      body: "多数经历停在「做了什么」，没有「带来什么结果」。每条补一个可量化的 Result：留存、转化、效率、规模任选其一。",
      suggestion: "每条经历补一个可量化 Result：留存/转化/效率/规模任选一个，例：「公众号阅读量 870 → 1.4k」。",
      affected: "影响 4 条经历",
    },
  ],

  rewrites: [
    {
      id: "R-01",
      section: "实习 · 互联网公司",
      tag: "运营实习生",
      improvement: "+18 分",
      before: "负责日常运营工作，协助团队完成各项任务",
      after: "主导 3 场新人引导活动（日均触达 2.4k 用户），通过 A/B 优化文案使 7 日留存提升 11%",
      issues: ["动词无力", "无结果"],
      wins: ["量化结果", "方法学", "JD 关键词"],
    },
    {
      id: "R-02",
      section: "项目 · 校园数据分析",
      tag: "数据志愿者",
      improvement: "+12 分",
      before: "参与数据整理，帮助老师完成调研报告",
      after: "用 SQL 清洗 1.2 万条问卷数据，搭建 3 张指标看板，将周报产出从 2 天压缩到 4 小时",
      issues: ["被动参与", "无硬技能"],
      wins: ["量化结果", "SQL", "效率提升"],
    },
    {
      id: "R-03",
      section: "社团 · 学生会",
      tag: "宣传部部长",
      improvement: "+9 分",
      before: "负责公众号运营，提升了关注度",
      after: "重构公众号选题 SOP，月更 12 篇，3 个月涨粉 0→4.3k，单篇最高阅读 1.1w",
      issues: ["结果模糊", "无方法"],
      wins: ["量化结果", "运营 SOP", "可复用方法"],
    },
  ],

  jd_match: {
    overall: 68,
    buckets: [
      {
        title: "硬性能力",
        hits: 2,
        total: 5,
        items: [
          { label: "数据分析", status: "命中" },
          { label: "用户增长", status: "命中" },
          { label: "A/B 实验", status: "弱" },
          { label: "SQL", status: "缺失" },
          { label: "数据看板", status: "缺失" },
        ],
      },
      {
        title: "软性偏好",
        hits: 3,
        total: 4,
        items: [
          { label: "沟通能力", status: "命中" },
          { label: "推动力", status: "命中" },
          { label: "跨部门协作", status: "命中" },
          { label: "抗压能力", status: "弱" },
        ],
      },
      {
        title: "隐性关键词",
        hits: 1,
        total: 4,
        items: [
          { label: "达人/商家", status: "缺失" },
          { label: "运营 SOP", status: "缺失" },
          { label: "电商", status: "弱" },
          { label: "社区运营", status: "命中" },
        ],
      },
    ],
    recommendation:
      "优先补硬性能力里的 SQL 与数据看板：在任意一段数据相关经历里写明你用 SQL 做了什么、产出了哪张看板。隐性关键词「运营 SOP / 达人商家」如有相关经历也值得点名——这些是 JD 字面没写、但 HR 会默默加分的词。",
  },

  next_steps: {
    title: "把这些改写应用到简历，再来一场模拟面试",
    subtitle: "按目标岗位生成 8–10 题，对空泛回答追问 2–3 层，最后给你一份可对比的复盘报告。",
  },
};

// 英文样例报告：与 zh 同结构、同分数；severity / status 仍用契约里的中文枚举
// （"高/中/低"、"命中/弱/缺失"——UI 据此派生颜色与 High/Med/Low 文案），所有展示文本为英文。
const en: DiagnosisReport = {
  overall_score: 86,
  level_tag: "Good · 12 changes away from 90",
  summary:
    "Overall this is a well-chosen, clearly structured resume — just short of clearing the initial screen. The biggest issues are weak verbs and frequently omitted results, so a recruiter can't see your real contribution; on JD fit, two hard requirements — SQL and experiment methodology — aren't shown. Rewrite your top 3 experiences in quantified STAR form first, and both fit and persuasiveness will rise together.",

  dimensions: [
    { label: "Clarity", score: 78, note: "Weak verbs, lots of room to quantify" },
    { label: "Logic", score: 82, note: "Timeline and cause-effect are clear" },
    { label: "JD Fit", score: 71, note: "SQL and experiment methods not shown" },
    { label: "Examples", score: 85, note: "Good material, stories can go deeper" },
    { label: "STAR structure", score: 76, note: "Result is often omitted" },
  ],

  kpi: { findings_count: 3, rewrites_count: 3 },

  findings: [
    {
      id: "F-01",
      severity: "高",
      dimension: "Clarity",
      basis: "Harvard·MIT standards · strong verbs / achievement-oriented",
      title: "\"Responsible for / assisted\" appears 6 times — it says nothing",
      body: "It's not clear what you actually did. Replace each one with a measurable, observable action: led / designed / broke down / shipped / A/B-tested…",
      suggestion: "Swap each \"responsible/assisted\" for a strong verb + one quantified result, e.g. \"Led 3 onboarding events, +11% 7-day retention\".",
      affected: "Affects 3 experiences",
    },
    {
      id: "F-02",
      severity: "中",
      dimension: "JD Fit",
      basis: "Job-skills DB · hard-skill gap",
      title: "SQL and A/B experiment methodology are never mentioned",
      body: "The JD lists \"data analysis + experiments\" as hard requirements, but the resume shows no SQL and no experiment design or significance testing. Even one line in one experience would recover some fit.",
      suggestion: "Add a data course/project stating what you did with SQL and which dashboard you built — put the JD's named hard skills on paper.",
      affected: "Fit -14 pts",
    },
    {
      id: "F-03",
      severity: "中",
      dimension: "STAR · structure",
      basis: "Employer preferences · quantified outcomes, results-first",
      title: "Result is often omitted — the story is only half told",
      body: "Most experiences stop at \"what I did\" with no \"what it produced\". Add one quantifiable Result to each: retention, conversion, efficiency or scale — any one.",
      suggestion: "Add a quantifiable Result to each experience — retention/conversion/efficiency/scale, e.g. \"account reads 870 → 1.4k\".",
      affected: "Affects 4 experiences",
    },
  ],

  rewrites: [
    {
      id: "R-01",
      section: "Internship · Internet company",
      tag: "Ops intern",
      improvement: "+18 pts",
      before: "Responsible for daily operations, assisted the team with various tasks",
      after: "Led 3 new-user onboarding events (≈2.4k daily reach); A/B-tested copy to lift 7-day retention by 11%",
      issues: ["Weak verbs", "No result"],
      wins: ["Quantified", "Methodology", "JD keywords"],
    },
    {
      id: "R-02",
      section: "Project · campus data analysis",
      tag: "Data volunteer",
      improvement: "+12 pts",
      before: "Took part in data cleanup, helped the professor finish a survey report",
      after: "Cleaned 12k survey rows with SQL, built 3 metric dashboards, cut weekly-report turnaround from 2 days to 4 hours",
      issues: ["Passive role", "No hard skill"],
      wins: ["Quantified", "SQL", "Efficiency gain"],
    },
    {
      id: "R-03",
      section: "Club · student union",
      tag: "PR lead",
      improvement: "+9 pts",
      before: "Responsible for the official account, grew the following",
      after: "Rebuilt the account's content SOP, 12 posts/month, 0→4.3k followers in 3 months, top post 11k reads",
      issues: ["Vague result", "No method"],
      wins: ["Quantified", "Ops SOP", "Reusable method"],
    },
  ],

  jd_match: {
    overall: 68,
    buckets: [
      {
        title: "Hard skills",
        hits: 2,
        total: 5,
        items: [
          { label: "Data analysis", status: "命中" },
          { label: "User growth", status: "命中" },
          { label: "A/B testing", status: "弱" },
          { label: "SQL", status: "缺失" },
          { label: "Dashboards", status: "缺失" },
        ],
      },
      {
        title: "Soft signals",
        hits: 3,
        total: 4,
        items: [
          { label: "Communication", status: "命中" },
          { label: "Drive", status: "命中" },
          { label: "Cross-team", status: "命中" },
          { label: "Resilience", status: "弱" },
        ],
      },
      {
        title: "Hidden keywords",
        hits: 1,
        total: 4,
        items: [
          { label: "Creators/sellers", status: "缺失" },
          { label: "Ops SOP", status: "缺失" },
          { label: "E-commerce", status: "弱" },
          { label: "Community ops", status: "命中" },
        ],
      },
    ],
    recommendation:
      "Prioritize SQL and dashboards under Hard skills: in any data-related experience, state what you did with SQL and which dashboard you produced. Hidden keywords like \"Ops SOP / creators & sellers\" are worth naming if you have relevant experience — the JD doesn't spell them out, but recruiters quietly reward them.",
  },

  next_steps: {
    title: "Apply these rewrites, then run a mock interview",
    subtitle: "8–10 role-specific questions, 2–3 follow-up layers on vague answers, ending in a comparable debrief.",
  },
};

/** 样例报告（按语言取）。落地页「看样例报告」与 /diagnose?sample=1 据当前语言渲染。 */
export const MOCK_REPORT: Record<Lang, DiagnosisReport> = { zh, en };
