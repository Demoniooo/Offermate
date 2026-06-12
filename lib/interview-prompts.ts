/* ============================================================
   OfferMate · 模拟面试提示词 v1（D10）
   把简历 + JD + 完整对话历史拼成一轮提示词，让模型扮演面试官：
   - 围绕固定 8 主题轴出题，每题都扣住简历/JD 的具体内容；
   - 回答缺「数字 / 方法 / 对照」就追问；
   - pressure 开关控制语气。

   分工（与诊断「服务端兜底」一致）：题号 / 追问层级 / 何时收尾由【服务端】用游标
   确定性推进并封顶，模型只产出三样——这一句话(reply)、是追问还是进下一题的判断(kind)、
   以及上一条回答是否空泛(vague)。服务端按 directive 预先框定本轮性质，模型据此生成措辞。
   模型无记忆——历史每轮全量回传，整段拼进 user 消息（与诊断的 [system,user] 两段式一致）。
   ============================================================ */

import type { InterviewMessage } from "./types";
import type { Lang } from "./rubric";

/** 计划主问题数（与前端「Q x/8」一致） */
export const TARGET_QUESTIONS = 8;
/** 同一主问题最多追问层数 */
export const MAX_FOLLOW_UPS = 3;

/** 本轮性质，由服务端按游标判定后下发；模型据此决定措辞 */
export type TurnDirective =
  | "first" // 开场：给第 1 道主问题
  | "advance" // 必须进入下一道主问题（追问已封顶 / 上题已答透）
  | "open" // 自由判断：追问上一题，或进入下一题
  | "close"; // 必须收尾

/** 固定 8 主题轴——服务端按题号取主题下发，保证覆盖与顺序 */
export const ARC: Record<Lang, string[]> = {
  zh: [
    "自我介绍，聚焦与目标岗位最相关的一段经历",
    "最有成就感的项目：做了什么、为何由你来做、最终结果如何",
    "深挖简历里的一个量化结果或关键说法（口径、样本量、对照组）",
    "一次失败 / 搞砸的经历：当时发生了什么、你怎么处理",
    "与同伴意见冲突时如何处理（要真实发生过的例子）",
    "JD 点名的一项硬技能，要一个真实使用场景（什么数据 / 怎么做 / 结论）",
    "情景 / 压力题：与岗位相关的突发状况，看处理优先级",
    "收尾前一问：你有什么想问我的",
  ],
  en: [
    "A one-minute self-intro, focused on the experience most relevant to the role",
    "The project you're proudest of: what you did, why it was you, what changed",
    "Dig into one quantified result or key claim on the resume (definition, sample, baseline)",
    "A time you failed or messed up: what happened and how you handled it",
    "How you handle disagreement with a teammate (a real example)",
    "A hard skill named in the JD — one real scenario (what data / how / what it told you)",
    "A scenario / pressure question relevant to the role, to see how you prioritize",
    "Any questions for me",
  ],
};

/** 取第 n 道主问题（1 起）的主题，越界则取最后一题 */
export function themeFor(lang: Lang, n: number): string {
  const arc = ARC[lang];
  return arc[Math.min(Math.max(n, 1), arc.length) - 1];
}

const speaker = (lang: Lang, role: InterviewMessage["role"]) =>
  lang === "zh"
    ? role === "interviewer" ? "面试官" : "候选人"
    : role === "interviewer" ? "Interviewer" : "Candidate";

/** 一个合法返回示例——强约束 JSON 结构（模型只回这三个字段） */
const EXAMPLE: Record<Lang, string> = {
  zh: JSON.stringify({
    reply: "你说这个活动「效果不错」——具体是哪个指标、对照之前提升了多少？给我一个数字。",
    kind: "follow_up",
    vague: true,
  }),
  en: JSON.stringify({
    reply: "You said the campaign \"did well\" — by which metric, and up how much versus before? Give me one number.",
    kind: "follow_up",
    vague: true,
  }),
};

export interface InterviewPromptInput {
  resume: string;
  jd?: string;
  history: InterviewMessage[];
  pressure: boolean;
  lang: Lang;
  directive: TurnDirective;
  /** 当前所在主问题号（open/advance 用；first 时为 0） */
  currentQuestion: number;
  /** 当前追问层级（open 用） */
  followDepth: number;
  /** 本轮若出新主问题，它的题号与主题（first/advance/open-推进 用） */
  nextQuestion: number;
  nextTheme: string;
  /** 开场联网生成的岗位研究简报（可选）；注入后出题更扣公司/岗位实情 */
  brief?: string;
}

export function buildInterviewMessages(input: InterviewPromptInput): { role: "system" | "user"; content: string }[] {
  const { resume, jd, history, pressure, lang, directive, currentQuestion, followDepth, nextQuestion, nextTheme, brief } = input;
  const isZh = lang === "zh";

  const transcript = history.length
    ? history.map((m) => `${speaker(lang, m.role)}：${m.content}`).join("\n")
    : isZh
      ? "（尚无对话）"
      : "(No conversation yet.)";

  const arcLine = ARC[lang].map((t, i) => `${i + 1}) ${t}`).join("  ");

  const system = isZh
    ? "你是一位经验丰富、要求严格的校招面试官，正在对候选人做一对一模拟面试。你每次只问一个问题，依据候选人的上一条回答判断该追问还是进入下一题。你永远只返回一个合法 JSON 对象，不输出任何其它文字。"
    : "You are a strict, experienced campus-recruiting interviewer running a 1:1 mock interview. You ask ONE question at a time and decide, from the candidate's last answer, whether to follow up or move on. You ALWAYS return a single valid JSON object and nothing else.";

  // 本轮指令：服务端已框定性质，模型只负责把措辞写对
  const directiveZh: Record<TurnDirective, string> = {
    first: `这是开场。直接给出第 ${nextQuestion} 道主问题，主题：「${nextTheme}」。先用一句话欢迎候选人，再扣住简历/JD 的具体内容提问。kind 填 "question"。`,
    advance: `上一题到此为止（追问已封顶或已答透），现在【进入下一道主问题】。出第 ${nextQuestion} 道主问题，主题：「${nextTheme}」，必须扣住简历或 JD 的具体内容（点名某段经历/数字/技能）。kind 填 "question"，不要再追问上一题。`,
    open: `你正在进行第 ${currentQuestion} 道主问题，已追问 ${followDepth}/${MAX_FOLLOW_UPS} 层。先判断候选人上一条回答是否空泛（缺数字/方法/对照）：\n  · 若空泛 → 针对【缺失的那一点】追问，逼出「做了什么、怎么做、结果如何」，kind 填 "follow_up"。\n  · 若已具体充分 → 进入第 ${nextQuestion} 道主问题，主题：「${nextTheme}」，kind 填 "question"。\n不要在最后一题之前就收尾。`,
    close: `面试到此结束（已答完或对话足够长）。给一段简短、真诚的收尾语并致谢，不要再提问。kind 填 "closing"。`,
  };
  const directiveEn: Record<TurnDirective, string> = {
    first: `This is the opening. Give main question ${nextQuestion}, theme: "${nextTheme}". Briefly welcome the candidate, then ask, anchored to specific resume/JD content. Set kind to "question".`,
    advance: `The previous question is done (follow-ups capped or fully answered); now [move to the next main question]. Ask main question ${nextQuestion}, theme: "${nextTheme}", anchored to specific resume/JD content (name an experience/number/skill). Set kind to "question"; do not follow up the previous one.`,
    open: `You are on main question ${currentQuestion}, with ${followDepth}/${MAX_FOLLOW_UPS} follow-ups so far. First judge whether the candidate's last answer is vague (missing numbers/method/comparison):\n  · If vague → follow up on [the missing piece] to force out "what they did, how, and what changed", set kind to "follow_up".\n  · If concrete and complete → move to main question ${nextQuestion}, theme: "${nextTheme}", set kind to "question".\nDo not close before the final question.`,
    close: `The interview ends here (answered, or the conversation is long enough). Give a short, sincere closing remark and thank them; ask nothing further. Set kind to "closing".`,
  };

  const rules = isZh
    ? `规则：
- 全场约 ${TARGET_QUESTIONS} 道主问题，主题轴依次为：${arcLine}
- 判定回答是否空泛，看三点：① 有没有数字/量化结果；② 有没有讲清具体方法（怎么做的）；③ 有没有对照/基线/结果。缺关键项或套话即为空泛。
- ${pressure
        ? "【压力面开启】语气更直接、不留情面，明确要求给事实和数字、不要形容词，可点破回答里的矛盾或回避。"
        : "【常规模式】语气专业、克制、鼓励，但保持持续深挖，不因为对方客气就放水。"}
- reply 用自然中文，一段话，不要列点、不要 markdown。
- vague 字段：填你对【上一条候选人回答是否空泛】的判断；开场没有候选人回答时填 false。`
    : `Rules:
- About ${TARGET_QUESTIONS} main questions total; theme axes in order: ${arcLine}
- Judge vagueness by three things: (1) numbers/quantified results; (2) a concrete method (how); (3) a baseline/comparison/result. Missing a key one, or generic filler, means vague.
- ${pressure
        ? "[PRESSURE MODE ON] Blunter, less forgiving; explicitly demand facts and numbers, not adjectives; you may call out contradictions or dodges."
        : "[NORMAL MODE] Professional, measured, encouraging — but keep digging; don't go easy just because they're polite."}
- reply: natural English prose, one paragraph, no bullet points, no markdown.
- vague: your judgment on whether [the candidate's last answer was vague]; false at the opening when there's no answer yet.`;

  const schema = isZh
    ? `只输出一个 JSON 对象，键名与下例完全一致，且只含这三个键：
- reply：面试官这一轮要说的话。
- kind："question" | "follow_up" | "closing"（按上方【本轮任务】填）。
- vague：布尔。
示例：${EXAMPLE.zh}`
    : `Output exactly ONE JSON object with these three keys only, matching the example:
- reply: what the interviewer says this turn.
- kind: "question" | "follow_up" | "closing" (per [This turn] above).
- vague: boolean.
Example: ${EXAMPLE.en}`;

  const jdBlock = jd && jd.trim()
    ? `\n\n=== JD ===\n${jd.trim()}`
    : isZh ? "\n\n（未提供 JD：从简历推断最可能的目标岗位再出题。）" : "\n\n(No JD provided: infer the most likely target role from the resume.)";

  const briefBlock = brief && brief.trim()
    ? `\n\n=== ${isZh ? "岗位研究简报（联网检索，供出题参考；据此设计问题，但不得当作候选人事实、不得据此编造数字）" : "Role research brief (web-sourced; use it to design questions, but never treat it as the candidate's facts or fabricate numbers from it)"} ===\n${brief.trim()}`
    : "";

  const user = [
    isZh ? "【本轮任务】" + directiveZh[directive] : "[This turn] " + directiveEn[directive],
    rules,
    schema,
    `=== ${isZh ? "简历" : "Resume"} ===\n${resume.trim()}${jdBlock}${briefBlock}`,
    `=== ${isZh ? "面试记录" : "Transcript"} ===\n${transcript}`,
    isZh ? "现在只输出本轮 JSON（必须以 { 开头、以 } 结尾）：" : "Now output only the JSON for this turn (must start with { and end with }):",
  ].join("\n\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
