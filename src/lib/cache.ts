import { Redis } from '@upstash/redis'

// Configuración de Redis con Upstash
// Make it safe for build time when env vars might be missing
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || 'https://dummy-url-for-build.upstash.io',
  token: process.env.KV_REST_API_TOKEN || 'dummy-token-for-build',
})

// Tiempos de cache en segundos
export const CACHE_TTL = {
  SEARCH: 30 * 60, // 30 minutes - popular searches
  POPULAR: 2 * 60 * 60, // 2 hours - popular content
  CATEGORIES: 24 * 60 * 60, // 24 hours - categories rarely change
  EVENTS: 15 * 60, // 15 minutes - events can change
  VENUES: 2 * 60 * 60, // 2 hours - venues rarely change
  POSTS: 1 * 60 * 60, // 1 hour - posts
} as const

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
  try {
    // Si no hay URL de Redis configurada (ej. en build), bypass del cache
    if (!process.env.KV_REST_API_URL) {
      return fetcher()
    }

    // 1. Intentar obtener del cache
    const cached = await redis.get<T>(key)
    if (cached !== null) {
      console.log(`🎯 Cache HIT: ${key}`)
      return cached
    }

    // 2. Si no está, obtener de la fuente original
    console.log(`💾 Cache MISS: ${key}`)
    const data = await fetcher()

    // 3. Guardar en cache
    await redis.setex(key, ttl, data)
    console.log(`✅ Cache SET: ${key} (${ttl}s)`)

    return data
  } catch (error) {
    console.error(`❌ Cache error for ${key}:`, error)
    // Si Redis falla, ejecutar el fetcher directamente
    return fetcher()
  }
}

// Función para invalidar cache
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    // Si no hay URL de Redis configurada, no hacer nada
    if (!process.env.KV_REST_API_URL) return

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
