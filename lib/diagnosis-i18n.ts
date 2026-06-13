/* ============================================================
   OfferMate 诊断页文案 + demo 报告数据（中/英），搬自原型 OfferMate_Diagnosis.html 的 I18N。
   D4/D5 接真模型后，报告部分会改为消费 lib/types.ts 的 DiagnosisReport。
   ============================================================ */

export const DIAGNOSIS_I18N = {
  zh: {
    tool_label: "简历诊断 · 体验", step1_label: "诊断", step2_label: "复盘", step3_label: "模拟面试",
    input_eyebrow: "STEP 01 · 简历诊断",
    input_title: "把简历粘进来，看见 HR 怎么看你。",
    input_sub: "校招 HR 视角逐条点评。粘贴简历（必填）；加上目标岗位 JD 还会出匹配分析。预计 30–60 秒出报告。",
    load_sample_btn: "用样例简历",
    resume_field_label: "简历内容", required_tag: "必填", count_unit: "字符",
    resume_placeholder: "把简历正文粘贴到这里。\n\n建议包含：教育、实习、项目、技能，每条都写清楚做了什么、用什么方法、结果是什么。\n\n不要附件、不要图，纯文字就行。",
    tip_1: "不要附件，纯文字效果最好", tip_2: "推荐 600–1500 字",
    pii_warn: "默认已本地遮蔽邮箱/电话；证件号等敏感信息请自行删除",
    jd_field_label: "目标岗位 JD", optional_tag: "可选",
    jd_placeholder: "粘贴目标岗位的 JD 描述。\n\n包含「职责」「要求」最佳。\n\n不填也可以，只是不会出 JD 匹配分析。",
    options_label: "诊断选项",
    opt_pressure: "压力面模式", opt_pressure_meta: "模拟面试时启用",
    opt_anon: "本地脱敏", opt_anon_meta: "发送前遮蔽邮箱 / 电话",
    privacy_1: "不存储简历内容", privacy_2: "不收集邮箱", privacy_3: "关闭页面即销毁",
    generate_btn: "生成诊断报告",
    perks: [
      { tag: "怎么用", text: "把简历从 Word / PDF 选中复制，粘贴到左侧框。我们只读文字，不读格式。" },
      { tag: "想加分", text: "右侧贴一份目标岗位 JD，会额外给一份匹配度分析和定向改写建议。" },
      { tag: "隐私", text: "所有内容在浏览器里处理。报告生成后，简历不会存在我们任何一台服务器上。" }],
    loading_eyebrow: "生成中", loading_title: "让一位校招 HR 帮你看完简历……", loading_sub: "预计 30–60 秒。可以离开这个页面去倒杯水。",
    loading_steps: [
      { label: "解析简历结构", meta: "提取段落 / 经历" },
      { label: "分维度打分", meta: "12 个评估维度" },
      { label: "对比 JD 关键词", meta: "硬技能 / 软偏好 / 隐性词" },
      { label: "生成 HR 视角点评", meta: "STAR 法则改写" }],
    loading_footer_label: "通常 < 60 秒", cancel_btn: "取消",
    report_eyebrow: "STEP 02 · 诊断报告", report_title: "简历诊断报告",
    report_meta_1: "产品运营实习 · 字节跳动", report_meta_2: "生成于 2026.06.11 11:42", report_meta_3: "Demo · 模拟数据",
    edit_btn: "修改简历重新诊断", export_btn: "导出 PDF",
    overall_label: "总分", level_tag: "良好 · 距离 90 还差 12 个改动",
    summary_blurb: "整体结构清晰、案例选材合理。主要扣分在「JD 匹配」与「表达」上——大量\"负责/协助\"动词、缺数字结果；以及与目标岗位的硬技能差（SQL、A/B 实验）写得不明显。",
    kpi_findings: "待修改项", kpi_rewrites: "改写示例", items_unit: "条",
    dim_1: "表达", dim_2: "逻辑", dim_3: "岗位匹配", dim_4: "案例", dim_5: "结构",
    dim_rows: [
      { label: "表达", score: 78, c: "#1F1F1F", note: "动词偏弱，可量化空间大" },
      { label: "逻辑", score: 82, c: "#1F1F1F", note: "时间线、因果关系清楚" },
      { label: "岗位匹配", score: 71, c: "#9A7A1A", note: "SQL 与实验方法学未体现" },
      { label: "案例质量", score: 85, c: "#1F1F1F", note: "选材好，故事尚可挖深" },
      { label: "STAR 结构", score: 76, c: "#9A7A1A", note: "Result 经常省略" }],
    findings_title: "最先要动的 3 件事", findings_total_label: "项发现，按影响力排序",
    basis_label: "依据", fix_label: "建议",
    findings: [
      { sev: "高", k: "miss", dim: "表达", basis: "Harvard·MIT 规范 · 强动词 / 成就导向", title: "\"负责 / 协助\"出现 6 次，等于没写", body: "看不出你\"做了什么\"。每一条都换成可量化、可观察的动作：主导 / 设计 / 拆解 / 上线 / A/B 测试……", fix: "把每条「负责/协助」换成强动词 + 一个量化结果，例：「主导 3 场新人引导活动，7 日留存 +11%」。", affected: "影响 3 条经历" },
      { sev: "高", k: "miss", dim: "岗位匹配", basis: "岗位技能库 · 硬技能缺口", title: "JD 里的 SQL / 实验方法学没出现", body: "岗位要求里点名的硬技能，简历里完全没提。即使学过，也写一条数据课程项目证明会用。", fix: "补一条数据课程/项目，写明用 SQL 做了什么、产出了哪张看板，把 JD 点名的硬技能落到纸面。", affected: "匹配度 −14 分" },
      { sev: "中", k: "weak", dim: "STAR · 结果", basis: "雇主偏好 · 量化成果 + 结果前置", title: "\"反响良好\"\"有所增长\"——结果不可信", body: "没有数字的结果不算结果。补一个百分比、一个绝对值，或一个对照——任何一个都行。", fix: "每条经历补一个可量化 Result：留存/转化/效率/规模任选一个，例：「公众号阅读量 870 → 1.4k」。", affected: "影响 4 条经历" }],
    rewrites_title: "逐条改写，选 3 个最高影响的来看", rewrites_count_label: "共 12 条 · 显示 3",
    before_label: "原文", after_label: "改后",
    rewrites: [
      {
        id: "R-01", sec: "实习 · 互联网公司", tag: "运营实习生", imp: "+18 分",
        before: "负责日常运营工作，协助团队完成各项任务",
        after: "主导 3 场新人引导活动（日均触达 2.4k 用户），通过 A/B 优化文案使 7 日留存提升 11%",
        issues: ["动词无力", "无结果"], wins: ["量化结果", "方法学", "JD 关键词"]
      },
      {
        id: "R-02", sec: "实习 · 互联网公司", tag: "运营实习生", imp: "+12 分",
        before: "撰写文案，提升用户体验",
        after: "为新人引导落地页撰写 4 版文案，通过 1500 用户 A/B 测试，挑选转化最高一版上线（CTR 6.8% → 9.1%）",
        issues: ["抽象", "无数字"], wins: ["过程清楚", "前后对比"]
      },
      {
        id: "R-03", sec: "校园 · 新媒体部", tag: "内容负责人", imp: "+9 分",
        before: "管理学生会公众号日常运营，粉丝有所增长",
        after: "运营学生会公众号（粉丝 1.2k → 3.4k，6 个月），策划 12 期专栏内容，平均阅读量 870",
        issues: ["模糊增长"], wins: ["时间区间", "绝对数字"]
      }],
    jd_match_title: "目标岗位：产品运营 · 字节跳动", match_label: "总匹配度",
    buckets: [
      { title: "硬性能力", hits: 3, total: 5, items: [["数据分析", "ok"], ["用户增长", "ok"], ["A/B 实验", "weak"], ["SQL", "miss"], ["数据看板", "miss"]] },
      { title: "软性偏好", hits: 3, total: 4, items: [["沟通能力", "ok"], ["推动力", "ok"], ["跨部门协作", "ok"], ["抗压能力", "weak"]] },
      { title: "隐性关键词", hits: 2, total: 4, items: [["达人/商家", "miss"], ["运营 SOP", "miss"], ["电商", "weak"], ["社区运营", "ok"]] }],
    recommend_label: "建议",
    recommend_body: "优先补两件事：(1) 把已有的\"运营实习\"细节往「数据 / 实验 / SQL」上靠，即便只是 Excel，也写出\"用 XX 维度拆解 → 找到 XX 机会 → 验证\"的链路；(2) 加一条课程 / 项目证明你用过 SQL——数据库课、实习里跑过的查询都算。",
    next_eyebrow: "STEP 03",
    next_title: "改完简历，马上拿到字节这个岗位的模拟面试",
    next_sub: "8–10 道题、压力面追问，基于这份简历 + JD 生成。面完会拿到一份和这份对比格式相同的复盘报告。",
    next_btn_primary: "开始模拟面试", next_btn_secondary: "先回去改简历",
    toast_msg: "模拟面试在 MVP 第 2 周上线——敬请期待",
    sample_resume: `王同学  ·  中国人民大学 信息管理 大三
hi@example.com  ·  13800000000

教育背景
中国人民大学  ·  信息管理与信息系统  ·  2022.09–2026.06
GPA 3.6/4.0  ·  数据库系统 / 统计学 / 用户研究 课程优秀

实习经历
某互联网公司  ·  产品运营实习生  ·  2024.06–2024.09
- 负责日常运营工作，协助团队完成各项任务
- 参与社区活动策划与执行，完成上级安排的工作
- 撰写文案，提升用户体验

校园项目
学生会新媒体部  ·  内容负责人  ·  2023.09–至今
- 管理学生会公众号日常运营，粉丝有所增长
- 组织线下活动，反响良好

技能
熟练使用 Excel、PPT；了解 Python 基础；英语 CET-6`,
    sample_jd: `产品运营实习生  ·  字节跳动  ·  抖音电商

岗位职责
- 负责达人/商家侧的运营策略落地与效果跟踪
- 通过数据分析定位增长机会，设计 A/B 实验
- 撰写运营 SOP 与培训材料，协作业务、产品、数据

任职要求
- 重点院校大三/大四在读
- 熟悉 SQL，具备基础数据分析能力
- 有用户增长 / 社区运营相关项目经历
- 沟通能力强，推动力强`,
  },
  en: {
    tool_label: "Resume diagnosis · demo", step1_label: "Diagnose", step2_label: "Debrief", step3_label: "Mock interview",
    input_eyebrow: "STEP 01 · Resume diagnosis",
    input_title: "Paste your resume. See what an HR sees.",
    input_sub: "Reviewed like a campus recruiter would. Paste your resume (required); add a JD for fit analysis too. ~30–60s to a full report.",
    load_sample_btn: "Use sample",
    resume_field_label: "Resume", required_tag: "required", count_unit: "chars",
    resume_placeholder: "Paste resume body here.\n\nInclude education, internships, projects, skills. For every bullet, say what you did, how, and the result.\n\nNo attachments, no images — plain text only.",
    tip_1: "No attachments, plain text works best", tip_2: "600–1500 chars recommended",
    pii_warn: "Email & phone are masked locally before sending; remove ID numbers yourself",
    jd_field_label: "Target JD", optional_tag: "optional",
    jd_placeholder: "Paste the target JD here.\n\n\"Responsibilities\" + \"Requirements\" works best.\n\nLeave empty if you just want the resume scored alone.",
    options_label: "Options",
    opt_pressure: "Pressure mode", opt_pressure_meta: "used in mock interview",
    opt_anon: "Anonymize locally", opt_anon_meta: "masks email & phone before sending",
    privacy_1: "Resume never stored", privacy_2: "No email collected", privacy_3: "Close the tab — it's gone",
    generate_btn: "Generate report",
    perks: [
      { tag: "How", text: "Select-all your resume in Word or PDF and paste into the left box. We read text only, ignore formatting." },
      { tag: "Bonus", text: "Paste a JD on the right and you also get a match analysis with targeted rewrite suggestions." },
      { tag: "Privacy", text: "Everything is processed in your browser session. Once the report is shown, the resume is not persisted on any of our servers." }],
    loading_eyebrow: "Working", loading_title: "A campus recruiter is reading your resume…", loading_sub: "Estimated 30–60s. Feel free to step away.",
    loading_steps: [
      { label: "Parsing resume structure", meta: "sections / experiences" },
      { label: "Scoring dimensions", meta: "12 dimensions" },
      { label: "Matching JD keywords", meta: "hard / soft / hidden" },
      { label: "Writing HR commentary", meta: "STAR rewrites" }],
    loading_footer_label: "usually < 60s", cancel_btn: "Cancel",
    report_eyebrow: "STEP 02 · Diagnosis report", report_title: "Resume diagnosis",
    report_meta_1: "Product Ops Intern · ByteDance", report_meta_2: "Generated 2026.06.11 11:42", report_meta_3: "Demo · mock data",
    edit_btn: "Edit & re-run", export_btn: "Export PDF",
    overall_label: "Overall", level_tag: "Good · 12 fixes away from 90",
    summary_blurb: "Structure and example-choice are solid. Most points are lost on JD fit and clarity — lots of \"responsible / assisted\" verbs, no numbers in results, and the JD's hard skills (SQL, A/B testing) are barely surfaced.",
    kpi_findings: "To fix", kpi_rewrites: "Rewrites", items_unit: "items",
    dim_1: "Clarity", dim_2: "Logic", dim_3: "JD Fit", dim_4: "Examples", dim_5: "Structure",
    dim_rows: [
      { label: "Clarity", score: 78, c: "#1F1F1F", note: "Weak verbs, easy quant wins" },
      { label: "Logic", score: 82, c: "#1F1F1F", note: "Timeline and cause are clear" },
      { label: "JD Fit", score: 71, c: "#9A7A1A", note: "SQL & experiments not shown" },
      { label: "Examples", score: 85, c: "#1F1F1F", note: "Good picks, deeper stories" },
      { label: "STAR structure", score: 76, c: "#9A7A1A", note: "Result is often omitted" }],
    findings_title: "The 3 things to fix first", findings_total_label: "findings, by impact",
    basis_label: "Basis", fix_label: "Fix",
    findings: [
      { sev: "High", k: "miss", dim: "Clarity", basis: "Harvard·MIT · strong verbs", title: "\"Responsible / assisted\" appears 6×", body: "These hide what you did. Replace each with a measurable verb — led / designed / shipped / A/B-tested / cut.", fix: "Swap each \"responsible/assisted\" for a strong verb + a number, e.g. \"led 3 onboarding events, +11% 7-day retention\".", affected: "Affects 3 bullets" },
      { sev: "High", k: "miss", dim: "JD Fit", basis: "Job-skills DB · hard-skill gap", title: "SQL & experiments — both missing", body: "Both are called out in the JD's requirements but never appear in the resume. Even one course project would close the gap.", fix: "Add one data course/project showing what you did with SQL and which dashboard you built — put the named hard skill on paper.", affected: "Match −14 pts" },
      { sev: "Med", k: "weak", dim: "STAR · Result", basis: "Employer prefs · quantified, results-first", title: "\"Well-received\" / \"grew\" — not a result", body: "A result without a number is not a result. Add a percentage, an absolute value, or a baseline — any one.", fix: "Add a measurable Result to each bullet — retention/conversion/efficiency/scale, e.g. \"870 → 1.4k reads\".", affected: "Affects 4 bullets" }],
    rewrites_title: "Top 3 highest-impact line rewrites", rewrites_count_label: "12 total · showing 3",
    before_label: "Before", after_label: "After",
    rewrites: [
      {
        id: "R-01", sec: "Intern · Internet Co.", tag: "Ops intern", imp: "+18 pts",
        before: "Responsible for daily operations, assisted team with various tasks",
        after: "Led 3 new-user onboarding events (2.4k DAU reach); A/B-tested copy lifted 7-day retention by 11%",
        issues: ["Weak verbs", "No result"], wins: ["Quantified", "Methodology", "JD keywords"]
      },
      {
        id: "R-02", sec: "Intern · Internet Co.", tag: "Ops intern", imp: "+12 pts",
        before: "Wrote copy, improved user experience",
        after: "Drafted 4 copy variants for onboarding LP; A/B-tested with 1.5k users; shipped winner (CTR 6.8% → 9.1%)",
        issues: ["Abstract", "No numbers"], wins: ["Clear process", "Before / after"]
      },
      {
        id: "R-03", sec: "Campus · New Media", tag: "Content lead", imp: "+9 pts",
        before: "Ran the official account, followers grew",
        after: "Ran council account (1.2k → 3.4k followers, 6mo); designed 12 column series, avg 870 reads",
        issues: ["Vague growth"], wins: ["Time range", "Absolute numbers"]
      }],
    jd_match_title: "Target: Product Ops · ByteDance", match_label: "Match",
    buckets: [
      { title: "Hard skills", hits: 3, total: 5, items: [["Data analysis", "ok"], ["User growth", "ok"], ["A/B testing", "weak"], ["SQL", "miss"], ["Dashboards", "miss"]] },
      { title: "Soft signals", hits: 3, total: 4, items: [["Communication", "ok"], ["Drive", "ok"], ["Cross-team", "ok"], ["Resilience", "weak"]] },
      { title: "Hidden keywords", hits: 2, total: 4, items: [["creators/sellers", "miss"], ["Ops SOP", "miss"], ["e-Commerce", "weak"], ["Community ops", "ok"]] }],
    recommend_label: "Recommendation",
    recommend_body: "Two priorities: (1) Reframe your existing ops internship around data / experiments / SQL — even Excel work counts if you spell out the \"split by X → spot Y → validate\" chain. (2) Add one course / project showing SQL usage — your DB class or any query you ran during the internship will do.",
    next_eyebrow: "STEP 03",
    next_title: "Now drill it: a mock interview for the same role",
    next_sub: "8–10 questions, 2–3 layers of follow-up, generated from this resume + JD. You'll get a debrief in the same side-by-side format.",
    next_btn_primary: "Start mock interview", next_btn_secondary: "Back to edit resume",
    toast_msg: "Mock interview ships in MVP week 2 — stay tuned",
    sample_resume: `Wang  ·  Renmin University, Information Mgmt, Junior
hi@example.com  ·  +86 138-0000-0000

EDUCATION
Renmin University · BSc Information Mgmt · 2022.09–2026.06
GPA 3.6/4.0 · DB Systems / Statistics / UX Research

EXPERIENCE
Some Internet Co.  ·  Product Ops Intern  ·  2024.06–2024.09
- Responsible for daily operations, assisted team with various tasks
- Participated in community event planning, completed assigned work
- Wrote copy, improved user experience

CAMPUS PROJECTS
Student Council New Media · Content Lead · 2023.09–present
- Ran the council's official account, followers grew
- Organized offline events, well-received

SKILLS
Excel, PPT; basic Python; English CET-6`,
    sample_jd: `Product Ops Intern  ·  ByteDance  ·  Douyin e-Commerce

Responsibilities
- Drive strategy & impact tracking for creators / merchants
- Surface growth opportunities via data; design A/B tests
- Write ops SOPs and training material; partner with biz/product/data

Requirements
- Tier-1 university, junior / senior
- SQL, basic data analysis
- Prior user-growth or community ops project
- Strong communicator, drives outcomes`,
  },
};

export const SEV_COLORS: Record<string, { bg: string; bd: string; fg: string }> = {
  ok: { bg: "#F7FAD9", bd: "#DCE85A", fg: "#4A5207" },
  weak: { bg: "#F8F1DE", bd: "#EBDCAE", fg: "#8A6A1F" },
  miss: { bg: "#FBE9E2", bd: "#EFC7B6", fg: "#B8401F" },
};

export type Lang = keyof typeof DIAGNOSIS_I18N;
export type DiagnosisDict = (typeof DIAGNOSIS_I18N)["zh"];
