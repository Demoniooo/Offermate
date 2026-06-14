/* ============================================================
   OfferMate · 接口限流（防失控 / 防脚本刷量）
   4 个 LLM 接口都是匿名公开的。当前网关是订阅制（不按 token 计费），
   所以限流不为省钱，而是：挡住脚本/爬虫刷量、防前端死循环失控、
   避免触发上游网关自身的 QPS/滥用限制。阈值设得很宽，正常用户感知不到。

   方案取舍（MVP）：纯内存 Map，零外部依赖。
   - 单实例（本地 dev / 单台部署）完全够用。
   - Serverless / 多实例横向扩展时，内存不跨实例共享、冷启动会清空——
     那时应换成 Upstash Redis 或 Vercel KV 做集中式计数（见 README 待办）。
   纯函数式滑窗：每个 key 存一串命中时间戳，窗口外的自动淘汰。
   ============================================================ */

export interface RateRule {
  /** 窗口长度（毫秒） */
  windowMs: number;
  /** 窗口内最多允许的请求数 */
  max: number;
}

interface Result {
  ok: boolean;
  /** 被限时建议的重试等待秒数（用于 Retry-After 头） */
  retryAfter: number;
}

// key -> 命中时间戳（升序）。仅进程内存，重启即清空。
const hits = new Map<string, number[]>();

// 周期性清扫，防止 Map 因大量一次性 IP 无限增长
let lastSweep = 0;
const SWEEP_INTERVAL = 5 * 60_000; // 5 分钟扫一次
const MAX_AGE = 60 * 60_000;       // 1 小时内无活动的 key 直接丢弃

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL) return;
  lastSweep = now;
  for (const [key, arr] of hits) {
    if (arr.length === 0 || arr[arr.length - 1] < now - MAX_AGE) hits.delete(key);
  }
}

/**
 * 取客户端 IP：优先 x-forwarded-for 的首段（最靠近用户的那一跳），
 * 回退 x-real-ip；都没有（如本地直连）则归一到 "local"。
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "local";
}

/**
 * 滑窗限流判定。key 应含路由名（如 `diagnose:1.2.3.4`），避免不同接口共享配额。
 * 命中即记一条时间戳；超额则拒绝并给出建议重试秒数。
 */
export function rateLimit(key: string, rule: RateRule): Result {
  const now = Date.now();
  sweep(now);

  const cutoff = now - rule.windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= rule.max) {
    // 窗口内最早的一条过期后即可再次请求
    const retryAfter = Math.max(1, Math.ceil((recent[0] + rule.windowMs - now) / 1000));
    hits.set(key, recent); // 写回已淘汰旧戳的数组，避免无限堆积
    return { ok: false, retryAfter };
  }

  recent.push(now);
  hits.set(key, recent);
  return { ok: true, retryAfter: 0 };
}
