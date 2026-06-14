/* ============================================================
   OfferMate 面试复盘页文案 + demo 数据（中/英），搬自原型 OfferMate_Review.html。
   D10+ 接 /api/debrief 后，复盘内容改为消费真实 InterviewDebrief；现先吃 mock。
   ============================================================ */

export type Lang = "zh" | "en";

/** 语义色（含高光 hl = 柠檬绿） */
export const REVIEW_COLORS: Record<string, { bg: string; bd: string; fg: string }> = {
  ok: { bg: "#F7FAD9", bd: "#DCE85A", fg: "#4A5207" },
  weak: { bg: "#F8F1DE", bd: "#EBDCAE", fg: "#8A6A1F" },
  miss: { bg: "#FBE9E2", bd: "#EFC7B6", fg: "#B8401F" },
  hl: { bg: "#E4F222", bd: "#C9D81C", fg: "#1F1F1F" },
};

/** 上一场五维（demo 对比用，画虚线雷达） */
export const PREV_DIMS = [75, 79, 66, 75, 63];

export const REVIEW_I18N = {
  zh: {
    tool_label: "面试复盘 · 体验", step1: "诊断", step2: "模拟面试", step3: "复盘",
    eyebrow: "STEP 03 · 面试复盘", title: "面试复盘报告",
    meta: ["产品运营实习 · 字节跳动", "第 2 场 · 8 题 · 23 分钟", "压力面 开启", "Demo · 模拟数据"],
    transcript_btn: "查看对话记录", export_btn: "导出 PDF", feedback_btn: "给点反馈",
    overall_label: "本场得分", overall_delta: "较上一场 +6",
    level_tag: "良好 · 主线答得稳，追问下细节还撑不住",
    summary: "开场与项目主线表达清晰，STAR 完整度比上一场明显提升；丢分集中在追问第 2–3 层——数据口径、样本量、个人贡献占比被问到时开始含糊。岗位匹配题（SQL、A/B 实验）仍是硬伤。",
    kpi_followups: "被追问", kpi_followups_unit: "次 / 8 题",
    kpi_highlights: "高光回答", kpi_highlights_unit: "个",
    dim_1: "表达", dim_2: "逻辑", dim_3: "岗位匹配", dim_4: "案例质量", dim_5: "追问应对",
    legend_now: "本场", legend_prev: "上一场",
    dims: [
      { label: "表达", score: 80, delta: "+5", c: "#1F1F1F", note: "口头禅「然后」明显减少" },
      { label: "逻辑", score: 82, delta: "+3", c: "#1F1F1F", note: "因果链清楚，时间线稳" },
      { label: "岗位匹配", score: 68, delta: "+2", c: "#9A7A1A", note: "SQL / 实验题仍答不实" },
      { label: "案例质量", score: 84, delta: "+9", c: "#1F1F1F", note: "社区项目讲出了细节" },
      { label: "追问应对", score: 71, delta: "+8", c: "#9A7A1A", note: "L2 开始数据含糊" }],
    moments_title: "三个关键时刻", moments_sub: "1 个高光 · 2 个翻车点，按影响排序",
    moments: [
      { kind: "hl", tag: "高光", dim: "案例质量", title: "社区项目的数字链路讲完整了",
        body: "Q2 里你完整说出「日均 2.4k 触达 → A/B 两版文案 → 7 日留存 +11%」，并主动给了对照组——这是全场最接近 offer 水平的回答。",
        fix: "保持：把「数字 + 口径 + 对照」这套结构复制到其余项目题。", affected: "发生在 Q2 · 一遍过" },
      { kind: "miss", tag: "翻车", dim: "追问应对", title: "「11% 怎么算的」——L2 追问当场卡壳",
        body: "被问到留存口径（7 日？次日？）和样本量时，回答「记不太清，大概是系统统计的」。数字讲不出口径，前面的可信度会整体崩掉。",
        fix: "给简历里每个数字配三件套：口径、样本量、对照——背不下来的数字就别写。", affected: "发生在 Q3 · 追问 L2" },
      { kind: "weak", tag: "待改进", dim: "岗位匹配", title: "SQL 题用「学过数据库」带过",
        body: "JD 点名 SQL，你的回答停在课程名，没有给出任何一次真实使用场景。",
        fix: "准备一个 60 秒 SQL 小案例：3 张表、一条 join、查出了什么结论。", affected: "发生在 Q6 · 追问 L1" }],
    upgrades_title: "逐题话术升级", upgrades_sub: "选 3 个提升最大的，照着练",
    before_label: "你的回答（实录）", after_label: "更好的说法",
    upgrades: [
      { id: "Q-03", sec: "项目深挖", tag: "追问 L2", imp: "+14 分",
        before: "呃，具体口径我记不太清了，应该是系统后台统计的 7 日留存吧，样本量挺大的。",
        after: "口径是 7 日留存，新用户随机分流各 750 人；A 版 31.2%、B 版 34.7%，相对提升 11%。看板是我用 Excel 拉的，每天早上更新。",
        issues: ["数据含糊", "口头禅"], wins: ["口径清楚", "有样本量", "主动补细节"] },
      { id: "Q-06", sec: "技能验证", tag: "追问 L1", imp: "+10 分",
        before: "SQL 的话我们数据库课学过，平时用得不算多，但上手应该没问题。",
        after: "课程大作业里我建了 3 张表存社团报名数据，常用 join 和 group by 拉转化漏斗；实习时也用它复核过一次活动名单去重。",
        issues: ["无场景", "自降可信"], wins: ["真实场景", "动作具体"] },
      { id: "Q-08", sec: "反问环节", tag: "L1", imp: "+6 分",
        before: "我暂时没有什么问题了，谢谢面试官。",
        after: "想请教一下：这个岗位前 3 个月，衡量新人做得好的 1–2 个指标会是什么？我想对照着准备。",
        issues: ["放弃送分题"], wins: ["展示目标感", "留下记忆点"] }],
    depth_title: "追问深度分布", depth_sub: "8 题 · 被追问 5 次 · 最深 L3",
    buckets: [
      { title: "一遍过", meta: "3 / 8 题", k: "ok", items: ["Q1 自我介绍", "Q2 项目主线", "Q5 团队协作"] },
      { title: "L2 后过关", meta: "3 / 8 题", k: "weak", items: ["Q4 失败经历", "Q7 抗压情景", "Q8 反问环节"] },
      { title: "L3 仍未答实", meta: "2 / 8 题", k: "miss", items: ["Q3 数据口径", "Q6 SQL 验证"] }],
    recommend_label: "下场之前",
    recommend_body: "只准备两件事：(1) 给简历里每个数字配齐「口径、样本量、对照」三件套，L2 追问就不会慌；(2) 把 SQL 小案例练到 60 秒讲完。这两处补上，这套题的预估得分能到 85+。",
    next_eyebrow: "继续练", next_title: "同一个岗位，换一套题再面一场",
    next_sub: "题目不重复，追问会更刁钻。面完直接对比两份复盘的雷达图，看进步落在哪个维度。",
    next_primary: "再练一场", next_secondary: "回去改简历",
    do_label: "怎么做",
    toast_msg: "该功能在 MVP 第 2 周上线——敬请期待",
  },
  en: {
    tool_label: "Interview debrief · demo", step1: "Diagnose", step2: "Mock interview", step3: "Debrief",
    eyebrow: "STEP 03 · Interview debrief", title: "Interview debrief",
    meta: ["Product Ops Intern · TikTok Shop", "Session 2 · 8 Qs · 23 min", "Pressure ON", "Demo · sample data"],
    transcript_btn: "View transcript", export_btn: "Export PDF", feedback_btn: "Give feedback",
    overall_label: "This session", overall_delta: "+6 vs last",
    level_tag: "Good · solid mainline, details crack under follow-ups",
    summary: "Opening and project mainline were clear; STAR completeness is visibly better than last session. Points were lost at follow-up layers 2–3 — metric definitions, sample sizes and your share of the work got vague. JD-fit questions (SQL, A/B) remain the weak spot.",
    kpi_followups: "Follow-ups", kpi_followups_unit: "of 8 Qs",
    kpi_highlights: "Highlights", kpi_highlights_unit: "answers",
    dim_1: "Clarity", dim_2: "Logic", dim_3: "JD Fit", dim_4: "Examples", dim_5: "Follow-up",
    legend_now: "This session", legend_prev: "Last session",
    dims: [
      { label: "Clarity", score: 80, delta: "+5", c: "#1F1F1F", note: "Far fewer filler words" },
      { label: "Logic", score: 82, delta: "+3", c: "#1F1F1F", note: "Clear causality, steady timeline" },
      { label: "JD Fit", score: 68, delta: "+2", c: "#9A7A1A", note: "SQL / experiments still thin" },
      { label: "Examples", score: 84, delta: "+9", c: "#1F1F1F", note: "Community project got real detail" },
      { label: "Follow-up", score: 71, delta: "+8", c: "#9A7A1A", note: "Numbers blur at L2" }],
    moments_title: "Three key moments", moments_sub: "1 highlight · 2 stumbles, by impact",
    moments: [
      { kind: "hl", tag: "Highlight", dim: "Examples", title: "The numbers chain finally landed",
        body: "In Q2 you delivered \"2.4k daily reach → two A/B copy variants → +11% 7-day retention\" with a control group, unprompted — the closest to offer-level all session.",
        fix: "Keep it: copy this \"number + definition + baseline\" structure to every project answer.", affected: "Q2 · passed in one" },
      { kind: "miss", tag: "Stumble", dim: "Follow-up", title: "\"How was that 11% measured?\" — froze at L2",
        body: "Asked about the retention window (7-day? next-day?) and sample size, you said \"I don't quite remember, the system tracked it.\" A number without a definition drags down everything before it.",
        fix: "Every resume number gets a trio: definition, sample size, baseline — if you can't recall the trio, cut the number.", affected: "Q3 · follow-up L2" },
      { kind: "weak", tag: "To fix", dim: "JD Fit", title: "SQL answered with \"took a database course\"",
        body: "The JD names SQL; your answer stopped at the course title with zero real usage.",
        fix: "Prep a 60-second SQL story: 3 tables, one join, what it told you.", affected: "Q6 · follow-up L1" }],
    upgrades_title: "Answer upgrades, per question", upgrades_sub: "Top 3 by gain — drill these",
    before_label: "Your answer (transcript)", after_label: "Stronger version",
    upgrades: [
      { id: "Q-03", sec: "Project deep-dive", tag: "Follow-up L2", imp: "+14 pts",
        before: "Uh, I don't remember the exact definition — probably 7-day retention from the backend, the sample was pretty big.",
        after: "7-day retention; new users split 750/750. A: 31.2%, B: 34.7% — +11% relative. I pulled the dashboard in Excel, refreshed every morning.",
        issues: ["Vague data", "Fillers"], wins: ["Clear definition", "Sample size", "Volunteered detail"] },
      { id: "Q-06", sec: "Skill check", tag: "Follow-up L1", imp: "+10 pts",
        before: "We covered SQL in the database course; I don't use it much but I'd pick it up fine.",
        after: "For the course project I built 3 tables of club sign-up data, used joins and group-by for a conversion funnel; at my internship I used it once to dedupe an event list.",
        issues: ["No scenario", "Self-undercut"], wins: ["Real scenario", "Concrete actions"] },
      { id: "Q-08", sec: "Your questions", tag: "L1", imp: "+6 pts",
        before: "No questions from me, thank you.",
        after: "One question: in the first 3 months, what 1–2 metrics tell you a new hire is doing well? I'd like to prepare against them.",
        issues: ["Free points wasted"], wins: ["Shows intent", "Memorable close"] }],
    depth_title: "Follow-up depth", depth_sub: "8 Qs · 5 follow-ups · deepest L3",
    buckets: [
      { title: "Passed in one", meta: "3 / 8", k: "ok", items: ["Q1 Intro", "Q2 Project mainline", "Q5 Teamwork"] },
      { title: "Cleared after L2", meta: "3 / 8", k: "weak", items: ["Q4 Failure story", "Q7 Pressure scenario", "Q8 Your questions"] },
      { title: "Still vague at L3", meta: "2 / 8", k: "miss", items: ["Q3 Metric definitions", "Q6 SQL check"] }],
    recommend_label: "Before next session",
    recommend_body: "Two things only: (1) give every resume number its trio — definition, sample size, baseline — and L2 stops being scary; (2) drill the 60-second SQL story. Fix both and this question set projects to 85+.",
    next_eyebrow: "Keep drilling", next_title: "Same role, fresh question set",
    next_sub: "No repeated questions; follow-ups get sharper. Afterwards, compare the two radar charts and see exactly where you improved.",
    next_primary: "Run another session", next_secondary: "Back to the resume",
    do_label: "Do this",
    toast_msg: "Shipping in MVP week 2 — stay tuned",
  },
};
