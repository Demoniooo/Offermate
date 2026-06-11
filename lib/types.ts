/* ============================================================
   OfferMate · 报告数据契约（D1「契约定稿」）
   后续所有页面 / API / mock 都吃这套类型。

   设计原则：契约只放「语义字段」（score / severity / status / 文本），
   不放颜色。颜色是表现层的事——由 UI 依据分数阈值与 severity/status
   派生，映射到 app/globals.css 里的设计 token。
   ============================================================ */

/** 发现项的严重度 */
export type Severity = "高" | "中" | "低";

/** JD 关键词命中状态 */
export type JDStatus = "命中" | "弱" | "缺失";

/** 五维评分中的单维 */
export interface ScoreDimension {
  /** 表达 / 逻辑 / 岗位匹配 / 案例质量 / STAR 结构 */
  label: string;
  /** 0–100 */
  score: number;
  /** 一句话说明，如「动词偏弱，可量化空间大」 */
  note: string;
}

/** 关键发现（HR 视角逐条点评） */
export interface Finding {
  id: string;
  severity: Severity;
  /** 命中的维度，如「表达」「岗位匹配」「STAR · 结构」 */
  dimension: string;
  /** 依据：命中的 rubric 标准（NACE / 雇主偏好 / Harvard·MIT / 岗位技能库），见 lib/rubric.ts */
  basis: string;
  title: string;
  /** 扣分原因（应引用简历原文） */
  body: string;
  /** 可执行修改建议（带数字的具体改写） */
  suggestion: string;
  /** 影响范围，如「影响 3 条经历」「匹配度 -14 分」 */
  affected: string;
}

/** 改写对比（before → after） */
export interface Rewrite {
  /** 如 "R-01" */
  id: string;
  /** 所属板块，如「实习 · 互联网公司」 */
  section: string;
  /** 角色标签，如「运营实习生」 */
  tag: string;
  /** 预估提升，如「+18 分」 */
  improvement: string;
  before: string;
  after: string;
  /** 原句问题，如 ["动词无力", "无结果"] */
  issues: string[];
  /** 改写亮点，如 ["量化结果", "方法学", "JD 关键词"] */
  wins: string[];
}

/** JD 匹配里单个关键词 */
export interface JDItem {
  label: string;
  status: JDStatus;
}

/** JD 匹配的一个分桶（硬性能力 / 软性偏好 / 隐性关键词） */
export interface JDBucket {
  title: string;
  hits: number;
  total: number;
  items: JDItem[];
}

/** JD 匹配分析（固定 3 桶：硬性 / 软性 / 隐性） */
export interface JDMatch {
  /** 总匹配度 0–100 */
  overall: number;
  buckets: JDBucket[];
  /** 定向修改建议 */
  recommendation: string;
}

/** 报告底部「下一步」引导 */
export interface NextSteps {
  title: string;
  subtitle: string;
}

/** 简历诊断报告（核心契约） */
export interface DiagnosisReport {
  /** 总分 0–100 */
  overall_score: number;
  /** 评级标签，如「良好 · 距离 90 还差 12 个改动」 */
  level_tag: string;
  /** 总览摘要 */
  summary: string;
  /** 五维评分，长度固定 5 */
  dimensions: ScoreDimension[];
  /** 概览计数 */
  kpi: { findings_count: number; rewrites_count: number };
  findings: Finding[];
  rewrites: Rewrite[];
  jd_match: JDMatch;
  next_steps: NextSteps;
}

/** /api/diagnose 的请求体契约（供 D4–D5 使用） */
export interface DiagnoseRequest {
  resume: string;
  /** 目标岗位 JD，可选；缺省时 jd_match 走通用建议 */
  jd?: string;
}
