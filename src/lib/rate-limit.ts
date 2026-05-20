import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Limiter = {
  limit: (key: string) => Promise<{ success: boolean; remaining: number; reset: number }>;
};

let messagesLimiter: Limiter | null = null;
let loginLimiter: Limiter | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function getMessagesRateLimiter(): Limiter {
  if (messagesLimiter) return messagesLimiter;

  const redis = getRedis();
  if (redis) {
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: false,
      prefix: "localpro:messages",
    });
    messagesLimiter = {
      async limit(key) {
        const res = await rl.limit(key);
        return { success: res.success, remaining: res.remaining, reset: res.reset };
      },
    };
    return messagesLimiter;
  }

  const memory = new Map<string, { count: number; resetAt: number }>();
  const WINDOW_MS = 60 * 60 * 1000;
  const MAX = 5;
  messagesLimiter = {
    async limit(key) {
      const now = Date.now();
      const bucket = memory.get(key);
      if (!bucket || bucket.resetAt < now) {
        memory.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return { success: true, remaining: MAX - 1, reset: now + WINDOW_MS };
      }
      if (bucket.count >= MAX) {
        return { success: false, remaining: 0, reset: bucket.resetAt };
      }
      bucket.count += 1;
      return { success: true, remaining: MAX - bucket.count, reset: bucket.resetAt };
    },
  };
  return messagesLimiter;
}

export function getLoginRateLimiter(): Limiter {
  if (loginLimiter) return loginLimiter;

  const redis = getRedis();
  if (redis) {
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: false,
      prefix: "localpro:login",
    });
    loginLimiter = {
      async limit(key) {
        const res = await rl.limit(key);
        return { success: res.success, remaining: res.remaining, reset: res.reset };
      },
    };
    return loginLimiter;
  }

  const memory = new Map<string, { count: number; resetAt: number }>();
  const WINDOW_MS = 15 * 60 * 1000;
  const MAX = 5;
  loginLimiter = {
    async limit(key) {
      const now = Date.now();
      const bucket = memory.get(key);
      if (!bucket || bucket.resetAt < now) {
        memory.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return { success: true, remaining: MAX - 1, reset: now + WINDOW_MS };
      }
      if (bucket.count >= MAX) {
        return { success: false, remaining: 0, reset: bucket.resetAt };
      }
      bucket.count += 1;
      return { success: true, remaining: MAX - bucket.count, reset: bucket.resetAt };
    },
  };
  return loginLimiter;
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
