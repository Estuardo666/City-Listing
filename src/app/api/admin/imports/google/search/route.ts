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
    const city = searchParams.get('city')
    const province = searchParams.get('province')
    const country = searchParams.get('country')
    const categoriesParam = searchParams.get('categories')
    const radius = searchParams.get('radius')

    if (!city || !categoriesParam || !radius) {
      return NextResponse.json(
        { error: 'Ciudad, categorías y radio son requeridos' },
        { status: 400 }
      )
    }

    const categories = categoriesParam.split(',').filter(Boolean)
    if (categories.length === 0) {
      return NextResponse.json({ error: 'Selecciona al menos una categoría' }, { status: 400 })
    }

    const locationQuery = [city, province, country].filter(Boolean).join(', ')

    const results = await googlePlacesImporter.searchPlaces(
      locationQuery,
      { lat: -3.99313, lng: -79.2042 },
      Number(radius),
      categories,
      20
    )

    const normalized = googlePlacesImporter.normalizePlaces(results)

    const placeIds = normalized.map((p) => p.google_place_id).filter(Boolean)
    const existingVenues =
      placeIds.length > 0
        ? await prisma.venue.findMany({
            where: { googlePlaceId: { in: placeIds } } as any,
            select: { id: true, name: true, slug: true, googlePlaceId: true } as any,
          })
        : []

    const existingMap = new Map(
      existingVenues.map((v: any) => [v.googlePlaceId, v])
    )

    const placesWithStatus = normalized.map((place) => ({
      ...place,
      alreadyImported: existingMap.has(place.google_place_id),
      existingVenue: existingMap.get(place.google_place_id) || null,
    }))

    return NextResponse.json({
      success: true,
      data: placesWithStatus,
      total: placesWithStatus.length,
      alreadyImported: existingVenues.length,
    })
  } catch (error) {
    console.error('Error searching Google Places:', error)
    return NextResponse.json({ error: 'Error al buscar en Google Places' }, { status: 500 })
  }
}
