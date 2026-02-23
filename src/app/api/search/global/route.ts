import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withCache, cacheKeys, CACHE_TTL } from '@/lib/cache'
import { searchDocuments } from '@/lib/search'

const LIMIT = 5

// Función para realizar búsqueda inteligente con Upstash Search
async function intelligentSearch(query: string) {
  try {
    console.log('🤖 Trying Upstash Search for:', query)
    const startTime = Date.now()
    
    // 1. Buscar con Upstash Search (inteligente)
    const searchResults = await searchDocuments(query, LIMIT * 2)
    
    const searchTime = Date.now() - startTime
    console.log(`📊 Upstash Search took ${searchTime}ms, found ${searchResults.length} results`)
    
    // 2. Agrupar resultados por tipo
    const events = searchResults
      .filter((r: any) => r.type === 'event')
      .slice(0, LIMIT)
      .map((r: any) => r.data)
    
    const venues = searchResults
      .filter((r: any) => r.type === 'venue')
      .slice(0, LIMIT)
      .map((r: any) => r.data)
    
    const posts = searchResults
      .filter((r: any) => r.type === 'post')
      .slice(0, LIMIT)
      .map((r: any) => r.data)

    // 3. Si Upstash Search devuelve resultados, usarlos
    if (events.length > 0 || venues.length > 0 || posts.length > 0) {
      console.log('✅ Using Upstash Search results')
      return { events, venues, posts }
    }

    console.log('⚠️ Upstash Search returned no results, using PostgreSQL')
    return searchInDatabase(query)

  } catch (error) {
    console.error('🤖 Upstash Search error, falling back to PostgreSQL:', error)
    // Si Upstash Search falla, usar PostgreSQL
    return searchInDatabase(query)
  }
}

// Función para realizar la búsqueda en la base de datos (optimizada)
async function searchInDatabase(query: string) {
  const startTime = Date.now()
  
  // Usar búsqueda más simple y rápida
  const contains = query

  // Ejecutar búsquedas en paralelo con consultas optimizadas
  const [events, venues, posts] = await Promise.all([
    // Eventos - solo campos indexados
    prisma.event.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { title: { contains, mode: 'insensitive' } },
          { location: { contains, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        startDate: true,
        location: true,
        category: { select: { name: true, color: true } }
      },
      orderBy: [{ featured: 'desc' }, { startDate: 'asc' }],
      take: LIMIT
    }),
    
    // Locales - solo campos indexados
    prisma.venue.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { name: { contains, mode: 'insensitive' } },
          { location: { contains, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        location: true,
        category: { select: { name: true, color: true } }
      },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      take: LIMIT
    }),
    
    // Posts - solo título
    prisma.post.findMany({
      where: {
        status: 'APPROVED',
        title: { contains, mode: 'insensitive' }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        publishedAt: true,
        category: { select: { name: true, color: true } }
      },
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
      take: LIMIT
    })
  ])

  const searchTime = Date.now() - startTime
  console.log(`📊 PostgreSQL search took ${searchTime}ms`)

  return { events, venues, posts }
}

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
    if (!q || q.length < 2) {
      return NextResponse.json({ events: [], venues: [], posts: [] })
    }

    // Usar cache para búsquedas populares (más de 2 caracteres)
    const cacheKey = cacheKeys.search(q)
    
    // Usar TTL del cache configurado. Esto usará Upstash Redis si está configurado,
    // pero consultará directamente a PostgreSQL en lugar de Upstash Vector para mayor velocidad.
    const results = await withCache(
      cacheKey,
      () => searchInDatabase(q),
      CACHE_TTL.SEARCH
    )

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
