/* ============================================================
   OfferMate · 复盘报告提示词（D13）
   把 lib/interview-rubric.ts 注入提示词，让模型按面试 rubric 给整场对话评分，
   强制输出严格 JSON。分工：模型只评判（维度分 / 点评 / 话术升级 / 关键时刻），
   计数类（追问次数、深度分桶、总分）由 /api/debrief 服务端算，不交给模型。
   关键：提供一个完整输出示例，模型对照示例结构远比对照抽象 schema 可靠。
   ============================================================ */

import { INTERVIEW_RUBRIC } from "./interview-rubric";
import type { Lang } from "./rubric";
import type { DebriefTurn } from "./types";

/** 复盘五维固定标签（取自 interview-rubric，保证雷达 5 轴一致） */
export const DEBRIEF_DIMS: Record<Lang, [string, string, string, string, string]> = {
  zh: INTERVIEW_RUBRIC.zh.dimensions.map((d) => d.label) as [string, string, string, string, string],
  en: INTERVIEW_RUBRIC.en.dimensions.map((d) => d.label) as [string, string, string, string, string],
};

/** 把 interview-rubric 蒸成提示词依据块（来源细则 + 维度 + 三原则） */
function rubricText(lang: Lang): string {
  const r = INTERVIEW_RUBRIC[lang];
  const isZh = lang === "zh";
  const sources = r.sources.map((s) => `- ${s.name}：${s.summary} 细则：${s.points.map((p) => `「${p}」`).join("；")}`).join("\n");
  const dims = r.dimensions.map((d) => `- ${d.label}：${d.assesses}`).join("\n");
  const principles = r.principles.map((p) => `- ${p.label}：${p.desc}`).join("\n");
  return isZh
    ? `评分依据（面试结构化 rubric，必须据此打分，不得凭印象）：\n${sources}\n\n五个维度各评什么：\n${dims}\n\n每条点评都要给：\n${principles}`
    : `Scoring basis (structured-interview rubric — score by this, not by impression):\n${sources}\n\nWhat each of the five dimensions assesses:\n${dims}\n\nEvery note must give:\n${principles}`;
}

/** 一个合法返回示例（缩略版，结构完整）——强约束模型按此结构输出 */
const EXAMPLE: Record<Lang, unknown> = {
  zh: {
    level_tag: "良好 · 主线答得稳，追问下细节还撑不住",
    summary: "开场与项目主线表达清晰，STAR 完整度不错；丢分集中在追问第 2–3 层——数据口径、样本量、个人贡献占比被问到时开始含糊。",
    dimensions: [
      { label: "表达", score: 80, note: "先结论后展开，口头禅少" },
      { label: "逻辑", score: 82, note: "因果链清楚" },
      { label: "岗位匹配", score: 68, note: "SQL / 实验题答不实" },
      { label: "案例质量", score: 84, note: "项目讲出了细节" },
      { label: "追问应对", score: 71, note: "L2 起数据含糊" },
    ],
    moments: [
      { kind: "hl", dim: "案例质量", title: "项目的数字链路讲完整了", body: "你完整说出「日均触达 → A/B 两版 → 留存提升」并主动给了对照组——全场最接近 offer 水平。", fix: "保持：把「数字+口径+对照」复制到其余项目题。", affected: "Q2 · 一遍过" },
      { kind: "miss", dim: "追问应对", title: "「留存怎么算的」当场卡壳", body: "被问口径与样本量，你答「记不太清，系统统计的」。数字讲不出口径，可信度会整体崩。", fix: "给每个数字配三件套：口径、样本量、对照。", affected: "Q3 · 追问 L2" },
    ],
    upgrades: [
      { section: "项目深挖", tag: "追问 L2", improvement: "+14 分", before: "呃，具体口径记不清了，应该是系统统计的 7 日留存吧。", after: "口径是 7 日留存，新用户随机分流各 750 人；A 版 31.2%、B 版 34.7%，相对提升 11%。", issues: ["数据含糊", "口头禅"], wins: ["口径清楚", "有样本量"] },
    ],
    recommendation: "下场之前只准备两件事：给简历里每个数字配齐「口径、样本量、对照」；把 SQL 小案例练到 60 秒讲完。",
  },
  en: {
    level_tag: "Good · solid mainline, details crack under follow-ups",
    summary: "Opening and project mainline were clear with decent STAR; points lost at follow-up layers 2–3 — metric definitions, sample sizes and personal contribution got vague.",
    dimensions: [
      { label: "Clarity", score: 80, note: "Conclusion first, few fillers" },
      { label: "Logic", score: 82, note: "Clear causality" },
      { label: "JD Fit", score: 68, note: "SQL / experiments thin" },
      { label: "Examples", score: 84, note: "Project had real detail" },
      { label: "Follow-up", score: 71, note: "Numbers blur from L2" },
    ],
    moments: [
      { kind: "hl", dim: "Examples", title: "The numbers chain landed", body: "You delivered \"daily reach → two A/B variants → retention lift\" with a control group, unprompted — closest to offer-level.", fix: "Keep it: copy \"number + definition + baseline\" to every project answer.", affected: "Q2 · passed in one" },
      { kind: "miss", dim: "Follow-up", title: "\"How was retention measured\" froze", body: "Asked for the window and sample, you said \"I don't quite remember, the system tracked it.\" A number without a definition drags everything down.", fix: "Give every number a trio: definition, sample size, baseline.", affected: "Q3 · follow-up L2" },
    ],
    upgrades: [
      { section: "Project deep-dive", tag: "Follow-up L2", improvement: "+14 pts", before: "Uh, I don't remember the exact definition — 7-day retention from the system probably.", after: "7-day retention; new users split 750/750. A: 31.2%, B: 34.7% — +11% relative.", issues: ["Vague data", "Fillers"], wins: ["Clear definition", "Sample size"] },
    ],
    recommendation: "Before next time, two things only: give every resume number its trio (definition, sample, baseline); drill the 60-second SQL story.",
  },
};

/** 把对话转成文本记录 */
function transcriptText(turns: DebriefTurn[], lang: Lang): string {
  const isZh = lang === "zh";
  return turns
    .map((m) => {
      const who = isZh ? (m.role === "interviewer" ? "面试官" : "候选人") : m.role === "interviewer" ? "Interviewer" : "Candidate";
      const tag = m.role === "interviewer" && m.fu ? (isZh ? `（追问 L${m.depth ?? 1}）` : ` (follow-up L${m.depth ?? 1})`) : "";
      return `${who}${tag}：${m.content}`;
    })
    .join("\n");
}

export function buildDebriefMessages(resume: string, jd: string | undefined, turns: DebriefTurn[], pressure: boolean, lang: Lang) {
  const isZh = lang === "zh";
  const dims = DEBRIEF_DIMS[lang].map((d) => `"${d}"`).join(", ");
  const example = JSON.stringify(EXAMPLE[lang]);
  const jdBlock = jd && jd.trim() ? `\n\n=== JD ===\n${jd.trim()}` : "";

  // 候选人专属原话清单：body/before 的引用只许从这里逐字取，杜绝把面试官的话安到候选人头上
  const candidates = turns.filter((m) => m.role === "candidate");
  const candList = candidates.length
    ? candidates.map((m, i) => `C${i + 1}${isZh ? "：" : ": "}${m.content}`).join("\n")
    : isZh ? "（候选人没有任何回答）" : "(the candidate gave no answers)";

  const rules = isZh
    ? `严格要求：
- 只输出一个 JSON 对象，不要任何解释、不要 markdown 代码块。
- 顶层字段必须且只能是：level_tag, summary, dimensions, moments, upgrades, recommendation。（总分、追问统计、深度分桶由系统另算，你不要输出。）
- dimensions 必须恰好 5 项，label 依次为 ${dims}，score 为 0–100 整数。
- 【分清谁说的·最重要】评价对象只有【候选人】。下面单列了【候选人原话】清单；body 与 before 只能逐字引用该清单里的句子。面试官的提问、面试官话里出现的技术名词/项目背景、以及简历里的文字，统统【不是】候选人的发言或贡献——绝不能写成「候选人说 / 主动提及 X」。下笔前先核对：这句出自【候选人原话】清单吗？不是就不能用，也不能算作他的高光。
- moments 产出 2–3 条：仅当候选人确有亮点时才给 1 条 kind="hl"（高光，同样只能基于候选人原话；答得普遍空泛就别硬凑高光，宁可全是 miss/weak）；其余用 "miss"（翻车）/"weak"（待改进）；body 必须逐字引用【候选人原话】清单里的句子（不得把面试官说的话当成候选人说的）；affected 写清在第几题第几层（如「Q3 · 追问 L2」）。
- upgrades 产出 2–3 条：before 逐字取自【候选人原话】清单，after 给一版照着 STAR 补全口径/动作/结果的更好说法；issues/wins 各 1–3 个短标签。
- 【after 不许编造数字】after 里的数字只能用候选人真实说过的；候选人没给的数字（GMV 金额、百分比、样本量等），一律用「X%」「N 场」「↑XX」这类占位符并在该句末尾加「（替换为你的真实数据）」，绝不替他编造具体数值。
- 【只依据对话】所有点评、引用、数字都只能来自这场对话与简历；对话里没有的事实不得编造。回答含糊的地方，就如实指出含糊，不要替候选人脑补内容。
- 【禁止套用示例】示例只约束 JSON 结构，不得把示例里的公司/数字（如「7 日留存」「31.2%」）搬进输出。
- 所有文本字段用简体中文。`
    : `Strict requirements:
- Output exactly ONE JSON object. No prose, no markdown fences.
- Top-level keys must be exactly: level_tag, summary, dimensions, moments, upgrades, recommendation. (Overall score, follow-up stats and depth buckets are computed by the system — do not output them.)
- dimensions: exactly 5, labels in order ${dims}, score an integer 0–100.
- [WHO SAID IT — MOST IMPORTANT] You evaluate ONLY the candidate. A "Candidate's own words" list is given below; body and before may only quote verbatim from that list. The interviewer's questions, any technical terms or project background the interviewer mentions, and the resume text are NOT the candidate's words or contribution — never write "the candidate said / proactively raised X" for them. Before writing, check: is this from the "Candidate's own words" list? If not, don't use it and don't count it as their highlight.
- moments: 2–3 items; include one kind="hl" (highlight) ONLY if the candidate genuinely had a strong moment (also grounded only in the candidate's own words) — if the answers were generally vague, don't manufacture a highlight, it's fine to have all "miss"/"weak"; body MUST quote verbatim from the "Candidate's own words" list (never attribute the interviewer's words to the candidate); affected names the question/layer (e.g. "Q3 · follow-up L2").
- upgrades: 2–3 items; before is taken verbatim from the "Candidate's own words" list, after gives a stronger STAR-complete version (definition/action/result); issues/wins are 1–3 short tags each.
- [NO FABRICATED NUMBERS IN after] Numbers in after may only be ones the candidate actually said; for any number they didn't give (GMV figures, percentages, sample sizes), use placeholders like "X%", "N events", "↑XX" and append "(replace with your real numbers)" — never invent specific values for them.
- [GROUND IN THE CONVERSATION] Every judgment, quote and number must come only from this conversation and the resume; never invent details not present. Where the answer was vague, say so — don't fill it in for the candidate.
- [DO NOT REUSE THE EXAMPLE] The example only constrains JSON structure; never carry its companies/numbers into your output.
- All text fields in English.`;

  const system = [
    isZh
      ? "你是一名严格、经验丰富的校招面试官，正在为刚结束的这场模拟面试写复盘。你永远只返回一个合法 JSON 对象，不输出任何其它文字。"
      : "You are a strict, experienced campus-recruiting interviewer writing the debrief for the mock interview that just ended. You ALWAYS return a single valid JSON object and nothing else.",
    rubricText(lang),
  ].join("\n\n");

  const user = [
    isZh ? "按上述 rubric 复盘下面这场面试。" : "Debrief the interview below, scoring by the rubric above.",
    (isZh
      ? "只输出一个 JSON 对象，键名与嵌套必须和下面示例完全一致，只替换内容："
      : "Output exactly ONE JSON object whose keys and nesting match this example precisely; replace only the content:") + "\n" + example,
    rules,
    `=== ${isZh ? "简历" : "Resume"} ===\n${resume.trim()}${jdBlock}`,
    `${isZh ? "压力面" : "Pressure mode"}: ${pressure ? (isZh ? "开启（判定从严）" : "ON (judge strictly)") : (isZh ? "关闭" : "OFF")}`,
    `=== ${isZh ? "面试记录" : "Transcript"} ===\n${transcriptText(turns, lang)}`,
    `=== ${isZh ? "候选人原话（body / before 的引用只能逐字取自这里）" : "Candidate's own words (body / before quotes may ONLY come verbatim from here)"} ===\n${candList}`,
    isZh ? "现在直接输出这场面试对应的 JSON（必须以 { 开头、以 } 结尾）：" : "Now output the JSON for this interview (must start with { and end with }):",
  ].join("\n\n");

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}
