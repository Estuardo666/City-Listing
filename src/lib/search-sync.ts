import { prisma } from '@/lib/prisma'
import { indexDocuments, type SearchDocument } from '@/lib/search'

// Función para sincronizar todos los datos con Upstash Search
export async function syncAllDataToSearch() {
  console.log('🔄 Starting data synchronization to Upstash Search...')

  try {
    // 1. Obtener todos los datos de PostgreSQL
    const [events, venues, posts] = await Promise.all([
      prisma.event.findMany({
        where: { status: 'APPROVED' },
        include: { category: true }
      }),
      prisma.venue.findMany({
        where: { status: 'APPROVED' },
        include: { category: true }
      }),
      prisma.post.findMany({
        where: { status: 'APPROVED' },
        include: { category: true }
      })
    ])

    // 2. Convertir a formato de búsqueda
    const searchDocs: SearchDocument[] = [
      ...events.map(event => ({
        id: event.id,
        type: 'event' as const,
        title: event.title,
        description: event.description || '',
        location: event.location,
        category: event.category.name,
        data: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          image: event.image,
          startDate: event.startDate,
          location: event.location,
          category: event.category
        }
      })),
      ...venues.map(venue => ({
        id: venue.id,
        type: 'venue' as const,
        title: venue.name,
        description: venue.description || '',
        location: venue.location,
        category: venue.category.name,
        data: {
          id: venue.id,
          name: venue.name,
          slug: venue.slug,
          image: venue.image,
          location: venue.location,
          category: venue.category
        }
      })),
      ...posts.map(post => ({
        id: post.id,
        type: 'post' as const,
        title: post.title,
        description: post.excerpt || '',
        category: post.category.name,
        data: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          image: post.image,
          publishedAt: post.publishedAt,
          category: post.category
        }
      }))
    ]

    // 3. Indexar en Upstash Search
    await indexDocuments(searchDocs)

    console.log(`✅ Synchronized ${searchDocs.length} documents to Upstash Search`)
    return {
      success: true,
      events: events.length,
      venues: venues.length,
      posts: posts.length,
      total: searchDocs.length
    }

  } catch (error) {
    console.error('❌ Sync error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Función para sincronizar un tipo específico de datos
export async function syncEventsToSearch() {
  const events = await prisma.event.findMany({
    where: { status: 'APPROVED' },
    include: { category: true }
  })

  const docs = events.map(event => ({
    id: event.id,
    type: 'event' as const,
    title: event.title,
    description: event.description || '',
    location: event.location,
    category: event.category.name,
    data: {
      id: event.id,
      title: event.title,
      slug: event.slug,
      image: event.image,
      startDate: event.startDate,
      location: event.location,
      category: event.category
    }
  }))

  await indexDocuments(docs)
  return docs.length
}

export async function syncVenuesToSearch() {
  const venues = await prisma.venue.findMany({
    where: { status: 'APPROVED' },
    include: { category: true }
  })

  const docs = venues.map(venue => ({
    id: venue.id,
    type: 'venue' as const,
    title: venue.name,
    description: venue.description || '',
    location: venue.location,
    category: venue.category.name,
    data: {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      image: venue.image,
      location: venue.location,
      category: venue.category
    }
  }))

  await indexDocuments(docs)
  return docs.length
}

export async function syncPostsToSearch() {
  const posts = await prisma.post.findMany({
    where: { status: 'APPROVED' },
    include: { category: true }
  })

  const docs = posts.map(post => ({
    id: post.id,
    type: 'post' as const,
    title: post.title,
    description: post.excerpt || '',
    category: post.category.name,
    data: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      image: post.image,
      publishedAt: post.publishedAt,
      category: post.category
    }
  }))

  await indexDocuments(docs)
  return docs.length
}
