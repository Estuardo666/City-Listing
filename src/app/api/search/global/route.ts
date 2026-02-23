import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const LIMIT = 5

// Función para realizar la búsqueda en la base de datos (optimizada)
async function searchInDatabase(query: string) {
  const startTime = Date.now()
  
  const contains = query

  // 1. Buscar primero las categorías que coincidan (es muy rápido y ayuda a encontrar resultados por categoría como "cafeteria")
  const matchedCategories = await prisma.category.findMany({
    where: { name: { contains, mode: 'insensitive' } },
    select: { id: true },
  })
  const categoryIds = matchedCategories.map((c) => c.id)

  // Ejecutar búsquedas en paralelo con consultas optimizadas
  const [events, venues, posts] = await Promise.all([
    // Eventos
    prisma.event.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { title: { contains, mode: 'insensitive' } },
          { location: { contains, mode: 'insensitive' } },
          ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : [])
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
    
    // Locales
    prisma.venue.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { name: { contains, mode: 'insensitive' } },
          { location: { contains, mode: 'insensitive' } },
          ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : [])
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
    
    // Posts
    prisma.post.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { title: { contains, mode: 'insensitive' } },
          ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : [])
        ]
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

    // Ejecutar búsqueda optimizada directamente sin capa Redis para reducir latencia HTTP
    const results = await searchInDatabase(q)

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

