import 'server-only'
import { Redis } from '@upstash/redis'

// Prefer the canonical KV names, but keep compatibility with the legacy names
// currently used by the Cloud Run service. The latter contain the historical
// "uptash_redish" typo and must not make the cache silently bypassable.
const redisRestUrl =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.uptash_redish_KV_REST_API_URL
const redisRestToken =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.uptash_redish_KV_REST_API_TOKEN

const REDIS_OPERATION_TIMEOUT_MS = 350
const REDIS_COOLDOWN_MS = 60 * 1000
const LOCAL_CACHE_MAX_ENTRIES = 256
const localCache = new Map<string, { value: unknown; expiresAt: number }>()
let redisUnavailableUntil = 0

// Configuración de Redis con Upstash
// Make it safe for build time when env vars might be missing
export const redis = new Redis({
  url: redisRestUrl || 'https://dummy-url-for-build.upstash.io',
  token: redisRestToken || 'dummy-token-for-build',
})

// Tiempos de cache en segundos
export const CACHE_TTL = {
  SEARCH: 30 * 60, // 30 minutes - popular searches
  POPULAR: 2 * 60 * 60, // 2 hours - popular content
  CATEGORIES: 24 * 60 * 60, // 24 hours - categories rarely change
  EVENTS: 15 * 60, // 15 minutes - events can change
  VENUES: 2 * 60 * 60, // 2 hours - venues rarely change
  POSTS: 1 * 60 * 60, // 1 hour - posts
  EXPLORE: 5 * 60, // 5 minutes - explore results
  OPEN_NOW: 60, // 1 minute - "abierto ahora" cambia con el reloj
  MOBILE_PUBLIC: 60, // 1 minute - public mobile DTOs stay fresh without a DB hit per request
} as const

// Prevent a burst of identical cold requests from running the same expensive
// Prisma query several times in one server instance. Redis remains the
// cross-instance cache; this map only coalesces concurrent local misses.
const inFlight = new Map<string, Promise<unknown>>()

function localCacheRead<T>(key: string): { hit: boolean; value?: T } {
  const entry = localCache.get(key)
  if (!entry) return { hit: false }
  if (entry.expiresAt <= Date.now()) {
    localCache.delete(key)
    return { hit: false }
  }
  return { hit: true, value: entry.value as T }
}

function localCacheWrite<T>(key: string, value: T, ttl: number) {
  if (localCache.size >= LOCAL_CACHE_MAX_ENTRIES && !localCache.has(key)) {
    const oldestKey = localCache.keys().next().value
    if (oldestKey) localCache.delete(oldestKey)
  }
  localCache.set(key, { value, expiresAt: Date.now() + ttl * 1000 })
}

function localCacheDelete(key: string) {
  localCache.delete(key)
}

function patternMatches(key: string, pattern: string) {
  const expression = `^${pattern.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`
  return new RegExp(expression).test(key)
}

function localCacheDeletePattern(pattern: string) {
  for (const key of localCache.keys()) {
    if (patternMatches(key, pattern)) localCache.delete(key)
  }
}

function markRedisUnavailable(error: unknown) {
  redisUnavailableUntil = Date.now() + REDIS_COOLDOWN_MS
  console.error('❌ Redis cache temporarily disabled:', error)
}

async function withRedisTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`Redis timeout after ${REDIS_OPERATION_TIMEOUT_MS}ms`)), REDIS_OPERATION_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

// Función para generar clave de cache
export function getCacheKey(prefix: string, ...params: string[]): string {
  return `${prefix}:${params.join(':')}`
}

// Función genérica de cache con fallback
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.SEARCH
): Promise<T> {
  const running = inFlight.get(key)
  if (running) return running as Promise<T>

  const promise = (async () => {
    const local = localCacheRead<T>(key)
    if (local.hit) {
      console.log(`🎯 Local cache HIT: ${key}`)
      return local.value as T
    }

    const redisEnabled = Boolean(redisRestUrl && redisRestToken) && redisUnavailableUntil <= Date.now()
    if (redisEnabled) {
      try {
        const cached = await withRedisTimeout(redis.get<T>(key))
        if (cached !== null) {
          localCacheWrite(key, cached, ttl)
          console.log(`🎯 Cache HIT: ${key}`)
          return cached
        }
      } catch (error) {
        markRedisUnavailable(error)
      }
    }

    console.log(`💾 Cache MISS: ${key}`)
    const data = await fetcher()
    localCacheWrite(key, data, ttl)

    if (redisEnabled && redisUnavailableUntil <= Date.now()) {
      try {
        await withRedisTimeout(redis.setex(key, ttl, data))
        console.log(`✅ Cache SET: ${key} (${ttl}s)`)
      } catch (error) {
        // A cache outage must not turn a successful origin response into a 500.
        markRedisUnavailable(error)
      }
    }

    return data
  })()

  inFlight.set(key, promise)
  try {
    return await promise
  } finally {
    inFlight.delete(key)
  }
}

// Función para invalidar cache
export async function invalidateCache(pattern: string): Promise<void> {
  localCacheDeletePattern(pattern)
  try {
    // Si no hay URL de Redis configurada, no hacer nada
    if (!redisRestUrl || !redisRestToken || redisUnavailableUntil > Date.now()) return

    const keys = await withRedisTimeout(redis.keys(pattern))
    if (keys.length > 0) {
      await withRedisTimeout(redis.del(...keys))
      console.log(`🗑️ Cache invalidated: ${keys.length} keys matching ${pattern}`)
    }
  } catch (error) {
    markRedisUnavailable(`Error invalidating cache ${pattern}: ${String(error)}`)
  }
}

/** Best-effort single-key invalidation for callers that previously used redis.del directly. */
export async function deleteCacheKey(key: string): Promise<void> {
  localCacheDelete(key)
  if (!redisRestUrl || !redisRestToken || redisUnavailableUntil > Date.now()) return
  try {
    await withRedisTimeout(redis.del(key))
  } catch (error) {
    markRedisUnavailable(`Error deleting cache key ${key}: ${String(error)}`)
  }
}

// Funciones específicas para tu aplicación
export const cacheKeys = {
  search: (query: string) => getCacheKey('search', query.toLowerCase()),
  popularEvents: () => getCacheKey('popular', 'events'),
  popularVenues: () => getCacheKey('popular', 'venues'),
  categories: () => getCacheKey('categories'),
  eventsByCategory: (categoryId: string) => getCacheKey('events', 'category', categoryId),
  venuesByCategory: (categoryId: string) => getCacheKey('venues', 'category', categoryId),
} as const
