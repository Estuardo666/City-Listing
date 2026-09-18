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
  // Si no hay URL de Redis configurada (ej. en build), bypass del cache.
  if (!redisRestUrl || !redisRestToken) return fetcher()

  const running = inFlight.get(key)
  if (running) return running as Promise<T>

  const promise = (async () => {
    let cached: T | null = null
    try {
      cached = await redis.get<T>(key)
    } catch (error) {
      console.error(`❌ Cache read error for ${key}:`, error)
    }

    if (cached !== null) {
      console.log(`🎯 Cache HIT: ${key}`)
      return cached
    }

    console.log(`💾 Cache MISS: ${key}`)
    const data = await fetcher()

    try {
      await redis.setex(key, ttl, data)
      console.log(`✅ Cache SET: ${key} (${ttl}s)`)
    } catch (error) {
      // A cache outage must not turn a successful origin response into a 500.
      console.error(`❌ Cache write error for ${key}:`, error)
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
  try {
    // Si no hay URL de Redis configurada, no hacer nada
    if (!redisRestUrl || !redisRestToken) return

    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`🗑️ Cache invalidated: ${keys.length} keys matching ${pattern}`)
    }
  } catch (error) {
    console.error(`❌ Error invalidating cache ${pattern}:`, error)
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
