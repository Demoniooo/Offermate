/* ============================================================
   OfferMate · 假报告（从原型 OfferMate Diagnosis.dc.html 抄的完整样例）
   用途：D3 报告骨架的数据源；联调前前端先吃这份 mock。
   它必须满足 DiagnosisReport 契约——改契约时这里会先报类型错。
   ============================================================ */

import type { DiagnosisReport } from "./types";

export const mockReport: DiagnosisReport = {
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

  kpi: { findings_count: 7, rewrites_count: 12 },

  findings: [
    {
      id: "F-01",
      severity: "高",
      dimension: "表达",
      title: "「负责 / 协助」出现 6 次，等于没写",
      body: "看不出你「做了什么」。每一条都换成可量化、可观察的动作：主导 / 设计 / 拆解 / 上线 / A/B 测试……",
      affected: "影响 3 条经历",
    },
    {
      id: "F-02",
      severity: "中",
      dimension: "岗位匹配",
      title: "SQL 与 A/B 实验方法学只字未提",
      body: "JD 把「数据分析 + 实验」列为硬性要求，但简历里看不到 SQL、看不到实验设计与显著性判断。哪怕只在一段经历里补一句，匹配度就能回来一截。",
      affected: "匹配度 -14 分",
    },
    {
      id: "F-03",
      severity: "中",
      dimension: "STAR · 结构",
      title: "Result 经常被省略，故事只讲了一半",
      body: "多数经历停在「做了什么」，没有「带来什么结果」。每条补一个可量化的 Result：留存、转化、效率、规模任选其一。",
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
    title: "把这 12 处改写应用到简历，再来一场模拟面试",
    subtitle: "按目标岗位生成 8–10 题，对空泛回答追问 2–3 层，最后给你一份可对比的复盘报告。",
  },
};
