import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withCache, cacheKeys, CACHE_TTL } from '@/lib/cache'
import { searchDocuments } from '@/lib/search'

const LIMIT = 5

// Función para realizar búsqueda inteligente con Upstash Search
async function intelligentSearch(query: string) {
  try {
    // 1. Buscar con Upstash Search (inteligente)
    const searchResults = await searchDocuments(query, LIMIT * 2) // Buscamos más para filtrar
    
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

    // 3. Si Upstash Search no tiene suficientes resultados, complementar con PostgreSQL
    if (events.length < LIMIT || venues.length < LIMIT || posts.length < LIMIT) {
      console.log('🔍 Complementing search with PostgreSQL...')
      const fallbackResults = await searchInDatabase(query)
      
      return {
        events: [...events, ...fallbackResults.events.slice(events.length)].slice(0, LIMIT),
        venues: [...venues, ...fallbackResults.venues.slice(venues.length)].slice(0, LIMIT),
        posts: [...posts, ...fallbackResults.posts.slice(posts.length)].slice(0, LIMIT)
      }
    }

    return { events, venues, posts }

  } catch (error) {
    console.error('🤖 Upstash Search error, falling back to PostgreSQL:', error)
    // Si Upstash Search falla, usar PostgreSQL
    return searchInDatabase(query)
  }
}

// Función para realizar la búsqueda en la base de datos (fallback)
async function searchInDatabase(query: string) {
  const contains = query

  // 1. Buscar primero las categorías que coincidan (es muy rápido)
  const matchedCategories = await prisma.category.findMany({
    where: { name: { contains, mode: 'insensitive' } },
    select: { id: true },
  })
  const categoryIds = matchedCategories.map((c) => c.id)

  // 2. Ejecutar las búsquedas principales usando el IN en lugar de un JOIN complejo
  const [events, venues, posts] = await Promise.all([
    prisma.event.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { title: { contains, mode: 'insensitive' } },
          { location: { contains, mode: 'insensitive' } },
          ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : []),
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        startDate: true,
        location: true,
        category: { select: { name: true, color: true } },
      },
      orderBy: [{ featured: 'desc' }, { startDate: 'asc' }],
      take: LIMIT,
    }),
    prisma.venue.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { name: { contains, mode: 'insensitive' } },
          { location: { contains, mode: 'insensitive' } },
          ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        location: true,
        category: { select: { name: true, color: true } },
      },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      take: LIMIT,
    }),
    prisma.post.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { title: { contains, mode: 'insensitive' } },
          ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : []),
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        publishedAt: true,
        category: { select: { name: true, color: true } },
      },
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
      take: LIMIT,
    }),
  ])

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
    const results = await withCache(
      cacheKey,
      () => intelligentSearch(q),
      CACHE_TTL.SEARCH
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
