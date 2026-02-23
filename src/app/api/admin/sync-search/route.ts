import { NextRequest, NextResponse } from 'next/server'
import { syncAllDataToSearch, syncEventsToSearch, syncVenuesToSearch, syncPostsToSearch } from '@/lib/search-sync'

// Sincronizar todos los datos con Upstash Search
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let result

    switch (type) {
      case 'events':
        result = { synced: await syncEventsToSearch(), type: 'events' }
        break
      case 'venues':
        result = { synced: await syncVenuesToSearch(), type: 'venues' }
        break
      case 'posts':
        result = { synced: await syncPostsToSearch(), type: 'posts' }
        break
      case 'all':
      default:
        result = await syncAllDataToSearch()
        break
    }

    return NextResponse.json({
      message: 'Search synchronization completed',
      ...result
    })

  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Obtener estado de la sincronización
export async function GET() {
  return NextResponse.json({
    message: 'Search sync API',
    endpoints: {
      syncAll: 'POST /api/admin/sync-search',
      syncEvents: 'POST /api/admin/sync-search?type=events',
      syncVenues: 'POST /api/admin/sync-search?type=venues',
      syncPosts: 'POST /api/admin/sync-search?type=posts'
    }
  })
}
