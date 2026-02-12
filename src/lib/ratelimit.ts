import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client if credentials exist
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Rate limit configuration
const LIMIT_CONFIG = {
  ticketCreate: { max: 10, window: '1 m', windowMs: 60000 },
  comment: { max: 30, window: '1 m', windowMs: 60000 },
  fileUpload: { max: 5, window: '1 m', windowMs: 60000 },
};

// Start Upstash limiters (conditional)
export const rateLimiters = {
  ticketCreate: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          LIMIT_CONFIG.ticketCreate.max,
          LIMIT_CONFIG.ticketCreate.window as any
        ),
        analytics: true,
      })
    : null,

  comment: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          LIMIT_CONFIG.comment.max,
          LIMIT_CONFIG.comment.window as any
        ),
        analytics: true,
      })
    : null,

  fileUpload: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          LIMIT_CONFIG.fileUpload.max,
          LIMIT_CONFIG.fileUpload.window as any
        ),
        analytics: true,
      })
    : null,
};

export async function checkRateLimit(identifier: string, limiterType: keyof typeof rateLimiters) {
  const limiter = rateLimiters[limiterType];
  const config = LIMIT_CONFIG[limiterType];

  // Strategy 1: Distributed Upstash Redis
  if (limiter) {
    const result = await limiter.limit(identifier);
    if (!result.success) {
      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil((result.reset - Date.now()) / 1000)} seconds.`
      );
    }
    return { success: true, remaining: result.remaining };
  }

  // Strategy 2: In-Memory Fallback
  const allowed = simpleRateLimit(identifier + ':' + limiterType, config.max, config.windowMs);
  if (!allowed) {
    throw new Error(`Rate limit exceeded for ${limiterType}. Please wait before trying again.`);
  }

  return { success: true };
}

const inMemoryLimits = new Map<string, { count: number; resetAt: number }>();

export function simpleRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const existing = inMemoryLimits.get(identifier);

  if (!existing || now > existing.resetAt) {
    // Start new window
    inMemoryLimits.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (existing.count >= maxRequests) {
    // Rate limit exceeded
    return false;
  }

  // Increment count
  existing.count++;
  return true;
}
