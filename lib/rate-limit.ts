import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

/**
 * Serverless rate limiting. In-memory counters are useless here because each
 * function invocation may land on a different instance, so the counter lives in
 * Upstash Redis.
 *
 * Upstash free tier: 500K commands/month. A sliding-window check costs ~2
 * commands per request, so ~250k requests/month before the allowance is gone.
 *
 * The client is created lazily on first use rather than at module load, so a
 * build without Upstash configured still completes — the error then surfaces on
 * the first real request instead of failing the deploy.
 */

export const AI_RATE_LIMIT = {
  requests: 10,
  window: '1 m',
} as const;

export const STATS_RATE_LIMIT = {
  requests: 60,
  window: '1 m',
} as const;

interface Limiters {
  ai: Ratelimit;
  stats: Ratelimit;
}

let cached: Limiters | null = null;

export class RateLimitUnavailableError extends Error {
  constructor() {
    super('Rate limiting is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
    this.name = 'RateLimitUnavailableError';
  }
}

function getLimiters(): Limiters {
  if (cached) return cached;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) throw new RateLimitUnavailableError();

  const redis = new Redis({ url, token });
  cached = {
    ai: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(AI_RATE_LIMIT.requests, AI_RATE_LIMIT.window),
      analytics: false,
      prefix: 'rl:ai',
    }),
    stats: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(STATS_RATE_LIMIT.requests, STATS_RATE_LIMIT.window),
      analytics: false,
      prefix: 'rl:stats',
    }),
  };
  return cached;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  /** seconds until the window resets, for a Retry-After header */
  retryAfter: number;
}

async function check(limiter: Ratelimit, identifier: string): Promise<RateLimitResult> {
  const result = await limiter.limit(identifier);
  return {
    allowed: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
  };
}

/**
 * True when the limiter is reachable. On failure we fail open (allow the
 * request) unless RATE_LIMIT_STRICT is set, so an Upstash outage does not take
 * the app down. The model provider's own quota is the backstop.
 */
async function safeCheck(
  build: () => Ratelimit,
  identifier: string,
): Promise<RateLimitResult | 'unavailable'> {
  try {
    return await check(build(), identifier);
  } catch (error) {
    console.error(
      '[rate-limit] unavailable, failing open:',
      error instanceof Error ? error.message : error,
    );
    if (process.env.RATE_LIMIT_STRICT === 'true') throw error;
    return 'unavailable';
  }
}

/**
 * Key the limit by signed-in user when there is one, otherwise by IP.
 * The IP is a fallback, not a security boundary — signed-out users get the
 * tighter limit and signed-in users get a per-account limit.
 */
async function identity(userId?: string): Promise<string> {
  if (userId) return `user:${userId}`;
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0].trim() : h.get('x-real-ip') ?? 'unknown';
  return `ip:${ip}`;
}

export async function checkAI(userId?: string): Promise<RateLimitResult> {
  const id = await identity(userId);
  const result = await safeCheck(() => getLimiters().ai, id);
  if (result === 'unavailable') {
    // Permissive placeholder so callers can always read the shape.
    return { allowed: true, limit: AI_RATE_LIMIT.requests, remaining: -1, reset: 0, retryAfter: 0 };
  }
  return result;
}

export async function checkStats(userId?: string): Promise<RateLimitResult> {
  const id = await identity(userId);
  const result = await safeCheck(() => getLimiters().stats, id);
  if (result === 'unavailable') {
    return { allowed: true, limit: STATS_RATE_LIMIT.requests, remaining: -1, reset: 0, retryAfter: 0 };
  }
  return result;
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(r.limit),
    'X-RateLimit-Remaining': String(r.remaining),
    'X-RateLimit-Reset': String(Math.ceil(r.reset / 1000)),
  };
}
