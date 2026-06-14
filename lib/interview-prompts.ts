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

/**
 * 两个合法返回示例——分别示范两种分支，避免模型只照抄「追问」这一种。
 * vague=true 配 follow_up；vague=false 配 question（答得充分就进下一题）。
 */
const EXAMPLE: Record<Lang, { vague: string; solid: string }> = {
  zh: {
    vague: JSON.stringify({
      reply: "你说这个活动「效果不错」——具体是哪个指标、对照之前提升了多少？给我一个数字。",
      kind: "follow_up",
      vague: true,
    }),
    solid: JSON.stringify({
      reply: "数据、做法和对照都讲清楚了，挺扎实。那我们看下一题：……（这里直接抛出下一道主问题）",
      kind: "question",
      vague: false,
    }),
  },
  en: {
    vague: JSON.stringify({
      reply: "You said the campaign \"did well\" — by which metric, and up how much versus before? Give me one number.",
      kind: "follow_up",
      vague: true,
    }),
    solid: JSON.stringify({
      reply: "Numbers, method and baseline are all clear — solid. Next question: …（ask the next main question here）",
      kind: "question",
      vague: false,
    }),
  },
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
    open: `你正在进行第 ${currentQuestion} 道主问题，已追问 ${followDepth}/${MAX_FOLLOW_UPS} 层。先判断候选人上一条回答是否空泛：\n  · 若空泛（基本没有数字/结果、或只给了结论没讲具体做法、或通篇套话）→ vague 填 true、kind 填 "follow_up"，针对【最关键的那个缺失点】追问一次。\n  · 若已答得充分（把「做了什么、怎么做、结果如何」讲清楚了，哪怕不是每个数字都完美）→ vague 填 false、kind 填 "question"，直接进入第 ${nextQuestion} 道主问题，主题：「${nextTheme}」，不要再追问上一题。\nvague 与 kind 必须一致：追问 = 你认为还没答到位；进下一题 = 你认为答够了。答得扎实就大方推进，别对已经讲清楚的回答继续纠缠。不要在最后一题之前就收尾。`,
    close: `面试到此结束（已答完或对话足够长）。给一段简短、真诚的收尾语并致谢，不要再提问。kind 填 "closing"。`,
  };
  const directiveEn: Record<TurnDirective, string> = {
    first: `This is the opening. Give main question ${nextQuestion}, theme: "${nextTheme}". Briefly welcome the candidate, then ask, anchored to specific resume/JD content. Set kind to "question".`,
    advance: `The previous question is done (follow-ups capped or fully answered); now [move to the next main question]. Ask main question ${nextQuestion}, theme: "${nextTheme}", anchored to specific resume/JD content (name an experience/number/skill). Set kind to "question"; do not follow up the previous one.`,
    open: `You are on main question ${currentQuestion}, with ${followDepth}/${MAX_FOLLOW_UPS} follow-ups so far. First judge whether the candidate's last answer is vague:\n  · If vague (almost no numbers/result, or a conclusion with no concrete method, or all filler) → set vague=true, kind="follow_up", and probe the single most important missing piece once.\n  · If it's already solid (they made clear what they did, how, and what changed — even if not every number is perfect) → set vague=false, kind="question", and move straight to main question ${nextQuestion}, theme: "${nextTheme}"; do not follow up the previous one.\nvague and kind must agree: a follow-up means you think it's not answered well enough; moving on means you think it's good enough. When an answer is solid, advance confidently — don't keep poking at something already explained. Do not close before the final question.`,
    close: `The interview ends here (answered, or the conversation is long enough). Give a short, sincere closing remark and thank them; ask nothing further. Set kind to "closing".`,
  };

  const rules = isZh
    ? `规则：
- 全场约 ${TARGET_QUESTIONS} 道主问题，主题轴依次为：${arcLine}
- 判定空泛要克制：只有当回答基本没有数字/结果、或只有结论没有具体做法、或通篇套话时，才算空泛。三项（数字、方法、对照）里只缺一项、但整体把事情讲清楚了，就算充分——进入下一题，别因为不够完美就一直追问。
- ${pressure
        ? "【压力面开启】语气更直接、不留情面，明确要求给事实和数字、不要形容词，可点破回答里的矛盾或回避；但只要确实答到位了，照样推进到下一题。"
        : "【常规模式】语气专业、克制、鼓励：答得不到位就追问到位，答得扎实就大方推进到下一题，不做无谓纠缠。"}
- reply 用自然中文，一段话，不要列点、不要 markdown。
- vague 字段：填你对【上一条候选人回答是否空泛】的判断；开场没有候选人回答时填 false。`
    : `Rules:
- About ${TARGET_QUESTIONS} main questions total; theme axes in order: ${arcLine}
- Judge vagueness sparingly: an answer is vague only if it has almost no numbers/result, or gives a conclusion with no concrete method, or is all filler. Missing just one of the three (number / method / comparison) while still making the story clear counts as adequate — move on; don't keep following up just because it isn't perfect.
- ${pressure
        ? "[PRESSURE MODE ON] Blunter, less forgiving; explicitly demand facts and numbers, not adjectives; you may call out contradictions or dodges — but once it is genuinely answered, still advance to the next question."
        : "[NORMAL MODE] Professional, measured, encouraging: follow up when an answer falls short, but advance confidently to the next question when it's solid — no needless poking."}
- reply: natural English prose, one paragraph, no bullet points, no markdown.
- vague: your judgment on whether [the candidate's last answer was vague]; false at the opening when there's no answer yet.`;

  const schema = isZh
    ? `只输出一个 JSON 对象，只含这三个键：
- reply：面试官这一轮要说的话。
- kind："question" | "follow_up" | "closing"（按上方【本轮任务】填）。
- vague：布尔，表示上一条候选人回答是否空泛（必须与 kind 一致：追问→true，进下一题/收尾→false）。
两种典型情况各举一例（按实际情况二选一，只输出一个对象）：
- 上一条空泛：${EXAMPLE.zh.vague}
- 上一条已答充分：${EXAMPLE.zh.solid}`
    : `Output exactly ONE JSON object with these three keys only:
- reply: what the interviewer says this turn.
- kind: "question" | "follow_up" | "closing" (per [This turn] above).
- vague: boolean — whether the candidate's last answer was vague (must agree with kind: follow_up→true, question/closing→false).
Two typical cases, one example each (pick one per the actual situation, output a single object):
- Last answer vague: ${EXAMPLE.en.vague}
- Last answer solid: ${EXAMPLE.en.solid}`;

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
