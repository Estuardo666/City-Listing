import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { googlePlacesImporter } from '@/lib/google/google-places-importer'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const categoriesParam = searchParams.get('categories')
    const radius = searchParams.get('radius')
    const address = searchParams.get('address')
    const variationIndex = Number(searchParams.get('variationIndex') || '0')
    const pageToken = searchParams.get('pageToken') || undefined

    if (!lat || !lng || !categoriesParam || !radius) {
      return NextResponse.json(
        { error: 'Coordenadas, categorías y radio son requeridos' },
        { status: 400 }
      )
    }

    const categories = categoriesParam.split(',').filter(Boolean)
    if (categories.length === 0) {
      return NextResponse.json({ error: 'Selecciona al menos una categoría' }, { status: 400 })
    }

    const location = { lat: Number(lat), lng: Number(lng) }
    const locationQuery = address || `${lat}, ${lng}`

    const result = await googlePlacesImporter.searchPlacesPage(
      locationQuery,
      location,
      Number(radius),
      variationIndex,
      categories,
      pageToken
    )

    const normalized = googlePlacesImporter.normalizePlaces(result.data)

    const placeIds = normalized.map((p) => p.google_place_id).filter(Boolean)
    const existingVenues =
      placeIds.length > 0
        ? await prisma.venue.findMany({
            where: {
              googlePlaceId: { in: placeIds },
              status: { in: ['APPROVED', 'PENDING'] },
            } as any,
            select: { id: true, name: true, slug: true, googlePlaceId: true } as any,
          })
        : []

    const existingMap = new Map(existingVenues.map((v: any) => [v.googlePlaceId, v]))

    const placesWithStatus = normalized.map((place) => ({
      ...place,
      alreadyImported: existingMap.has(place.google_place_id),
      existingVenue: existingMap.get(place.google_place_id) || null,
    }))

    return NextResponse.json({
      success: true,
      data: placesWithStatus,
      nextPageToken: result.nextPageToken || null,
      hasMore: result.hasMore,
      variationIndex,
    })
  } catch (error) {
    console.error('Error searching Google Places:', error)
    return NextResponse.json({ error: 'Error al buscar en Google Places' }, { status: 500 })
  }
}
