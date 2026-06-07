import { redis } from '@/lib/cache'

const REVIEW_RATE_LIMIT_KEY = 'review_rate_limit'
const MAX_REVIEWS_PER_HOUR = 3
const WINDOW_SECONDS = 3600

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number
}

export async function checkReviewRateLimit(userId: string): Promise<RateLimitResult> {
  const key = `${REVIEW_RATE_LIMIT_KEY}:${userId}`

  try {
    const now = Date.now()
    const windowStart = now - WINDOW_SECONDS * 1000

    await redis.zremrangebyscore(key, 0, windowStart)

    const count = await redis.zcard(key)

    if (count >= MAX_REVIEWS_PER_HOUR) {
      const oldest = await redis.zrange(key, 0, 0, { withScores: true })
      const retryAfter = oldest.length > 0
        ? Math.ceil(((oldest[0] as number) + WINDOW_SECONDS * 1000 - now) / 1000)
        : WINDOW_SECONDS

      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.max(retryAfter, 1),
      }
    }

    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` })
    await redis.expire(key, WINDOW_SECONDS)

    return {
      allowed: true,
      remaining: MAX_REVIEWS_PER_HOUR - count - 1,
    }
  } catch {
    return { allowed: true, remaining: MAX_REVIEWS_PER_HOUR }
  }
}
