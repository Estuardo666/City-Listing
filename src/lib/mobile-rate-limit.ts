import { createHash } from 'node:crypto'
import { redis } from '@/lib/cache'

const WINDOW_SECONDS = 5 * 60
const MAX_ATTEMPTS = 20

export type MobileAuthRateLimit = {
  allowed: boolean
  retryAfter: number
}

function digest(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 24)
}

function requestAddress(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-real-ip') || 'unknown'
}

/** Best-effort distributed limiter. If Redis is unavailable, auth remains available. */
export async function checkMobileAuthRateLimit(request: Request, identity?: string): Promise<MobileAuthRateLimit> {
  const key = `mobile-auth:${digest(requestAddress(request))}:${digest((identity || '').toLowerCase())}`
  try {
    if (!process.env.KV_REST_API_URL) return { allowed: true, retryAfter: 0 }
    const attempts = await redis.incr(key)
    if (attempts === 1) await redis.expire(key, WINDOW_SECONDS)
    if (attempts > MAX_ATTEMPTS) return { allowed: false, retryAfter: WINDOW_SECONDS }
    return { allowed: true, retryAfter: 0 }
  } catch {
    return { allowed: true, retryAfter: 0 }
  }
}
