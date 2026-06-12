/* ============================================================
   OfferMate · 岗位研究简报提示词（面试增强）
   开场准备阶段，联网检索 JD 相关公开资料，产出一份「出题用」的简短简报。
   简报随简历/JD 一起，每轮回传进 /api/interview 的提示词，让出题更扣公司/岗位实情。
   产出是【纯文本】（联网结果本就内联在正文里），不强制 JSON。
   ============================================================ */

import type { Lang } from "./rubric";

/** 简报上限：它会每轮注入面试提示词，限长控成本（截断在服务端做） */
export const MAX_BRIEF = 1600;

export function buildResearchMessages(resume: string, jd: string | undefined, lang: Lang): { role: "system" | "user"; content: string }[] {
  const isZh = lang === "zh";
  const jdBlock = jd && jd.trim()
    ? `\n\n=== JD ===\n${jd.trim()}`
    : isZh ? "\n\n（未提供 JD：从简历推断最可能的目标岗位/行业再检索。）" : "\n\n(No JD: infer the most likely target role/industry from the resume, then search.)";

  const system = isZh
    ? "你是资深校招面试官的研究助理。你会联网检索岗位 JD 涉及的公司背景、岗位真实职责与常见考点，为面试官准备一份简短的『出题用简报』。只基于检索到的事实，不编造具体数字或新闻。"
    : "You are a research assistant to a senior campus-recruiting interviewer. You search the web for the company background, the role's real responsibilities and common assessment points behind the JD, and prepare a short 'briefing for question design'. Use only retrieved facts; never fabricate specific numbers or news.";

  const user = isZh
    ? [
        "联网检索后，为下面这个岗位准备一份简短的『面试出题简报』。",
        `输出 4 个小节（每节 2–4 句，全文控制在 350 字内）：
1. 公司 / 团队背景与近期动态（JD 点名公司就检索它；没点名就写该岗位所在行业概况）
2. 这个岗位的真实核心职责与考核重点
3. 该岗位常见的面试考点与能力项（技术栈 / 方法论 / 硬技能）
4. 结合这份简历，最该深挖、或最可能露怯的 2–3 个点
要求：基于检索事实，不编造具体数字或新闻；公开资料不足就直说『公开资料有限』。直接输出简报正文，不要前言、不要列参考链接。`,
        `=== 简历 ===\n${resume.trim()}${jdBlock}`,
      ].join("\n\n")
    : [
        "After searching the web, prepare a short 'interview question-design brief' for the role below.",
        `Output 4 sections (2–4 sentences each, under ~250 words total):
1. Company / team background and recent developments (search the company if the JD names one; otherwise summarize the role's industry)
2. The role's real core responsibilities and what's actually assessed
3. Common interview focal points and competencies for this role (tech stack / methods / hard skills)
4. Given this resume, the 2–3 points most worth digging into or most likely to crack
Rules: base it on retrieved facts; never fabricate specific numbers or news; if public info is thin, say so. Output the brief body directly — no preamble, no reference links.`,
        `=== Resume ===\n${resume.trim()}${jdBlock}`,
      ].join("\n\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
