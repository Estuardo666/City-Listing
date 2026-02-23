import { NextRequest, NextResponse } from 'next/server'
import { redis, cacheKeys, withCache } from '@/lib/cache'
import { invalidateAllCache } from '@/lib/cache-invalidation'

// GET: Ver estado del cache
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const query = searchParams.get('query') || 'test'

    switch (action) {
      case 'test':
        // Probar el cache con una búsqueda de prueba
        const testKey = cacheKeys.search(query)
        
        // Primera vez (debería ser MISS)
        console.log('🧪 First search (should be MISS)...')
        const start1 = Date.now()
        await withCache(testKey, async () => {
          await new Promise(resolve => setTimeout(resolve, 100)) // Simular DB delay
          return { message: 'Test result', timestamp: Date.now() }
        }, 30)
        const time1 = Date.now() - start1
        
        // Segunda vez (debería ser HIT)
        console.log('🧪 Second search (should be HIT)...')
        const start2 = Date.now()
        const result = await withCache(testKey, async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return { message: 'Test result', timestamp: Date.now() }
        }, 30)
        const time2 = Date.now() - start2
        
        return NextResponse.json({
          success: true,
          test: {
            firstTime: { time: time1, cached: false },
            secondTime: { time: time2, cached: true },
            improvement: `${((time1 - time2) / time1 * 100).toFixed(1)}% faster`
          },
          result
        })

      case 'stats':
        // Mostrar estadísticas del cache
        try {
          // Upstash Redis no tiene método info(), usamos stats básicos
          const testKey = 'cache:stats:test'
          await redis.set(testKey, 'test')
          await redis.del(testKey)
          
          return NextResponse.json({
            success: true,
            message: 'Redis connection is working',
            note: 'Upstash Redis stats not available through info() method',
            test: 'Cache read/write test successful'
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Redis connection failed'
          })
        }

      case 'clear':
        // Limpiar todo el cache
        await invalidateAllCache()
        return NextResponse.json({
          success: true,
          message: 'All cache cleared'
        })

      default:
        return NextResponse.json({
          success: true,
          message: 'Cache debug API',
          actions: {
            test: '?action=test&query=your-search-query',
            stats: '?action=stats',
            clear: '?action=clear'
          }
        })
    }
  } catch (error) {
    console.error('Cache debug error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
