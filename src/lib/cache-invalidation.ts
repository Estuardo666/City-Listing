import { redis, invalidateCache, cacheKeys } from './cache'

// Función para invalidar cache cuando se modifican eventos
export async function invalidateEventCache(eventId?: string) {
  try {
    // Invalidar búsquedas globales (patrón general)
    await invalidateCache('search:*')
    
    // Invalidar eventos populares
    await redis.del(cacheKeys.popularEvents())
    
    // Si se proporciona un eventId específico, podríamos invalidar cachés específicas
    if (eventId) {
      console.log(`🗑️ Invalidated cache for event ${eventId}`)
    }
    
    console.log('✅ Event cache invalidated successfully')
  } catch (error) {
    console.error('❌ Error invalidating event cache:', error)
  }
}

// Función para invalidar cache cuando se modifican locales
export async function invalidateVenueCache(venueId?: string) {
  try {
    // Invalidar búsquedas globales
    await invalidateCache('search:*')
    
    // Invalidar locales populares
    await redis.del(cacheKeys.popularVenues())
    
    if (venueId) {
      console.log(`🗑️ Invalidated cache for venue ${venueId}`)
    }
    
    console.log('✅ Venue cache invalidated successfully')
  } catch (error) {
    console.error('❌ Error invalidating venue cache:', error)
  }
}

// Función para invalidar cache cuando se modifican categorías
export async function invalidateCategoryCache() {
  try {
    // Invalidar todo lo relacionado con categorías
    await invalidateCache('search:*')
    await invalidateCache('events:category:*')
    await invalidateCache('venues:category:*')
    await redis.del(cacheKeys.categories())
    
    console.log('✅ Category cache invalidated successfully')
  } catch (error) {
    console.error('❌ Error invalidating category cache:', error)
  }
}

// Función para invalidar cache cuando se modifican posts
export async function invalidatePostCache(postId?: string) {
  try {
    // Invalidar búsquedas globales
    await invalidateCache('search:*')
    
    if (postId) {
      console.log(`🗑️ Invalidated cache for post ${postId}`)
    }
    
    console.log('✅ Post cache invalidated successfully')
  } catch (error) {
    console.error('❌ Error invalidating post cache:', error)
  }
}

// Función general para invalidar todo el cache (usar en emergencias)
export async function invalidateAllCache() {
  try {
    await invalidateCache('*')
    console.log('🔥 All cache invalidated')
  } catch (error) {
    console.error('❌ Error invalidating all cache:', error)
  }
}
