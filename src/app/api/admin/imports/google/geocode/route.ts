import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, unauthorized } from '@/lib/api/require-admin'
import { googlePlacesService } from '@/lib/google-places'
import { googleImportError } from '@/lib/google/import-error'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) return unauthorized()

    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')?.trim()

    if (!address) {
      return NextResponse.json({ error: 'Dirección requerida' }, { status: 400 })
    }

    const { places: results } = await googlePlacesService.searchPlaces(address, {
      maxResultCount: 1,
    })

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró la dirección' },
        { status: 404 }
      )
    }

    const place = results[0]
    const location = place.location

    if (!location) {
      return NextResponse.json(
        { error: 'No se pudieron obtener las coordenadas' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        placeId: place.id,
        name: place.displayName?.text || address,
        formattedAddress: place.formattedAddress || address,
        lat: location.latitude,
        lng: location.longitude,
      },
    })
  } catch (error) {
    console.error('Geocode error:', error)
    const { status, ...diagnostic } = googleImportError(error)
    return NextResponse.json(diagnostic, { status })
  }
}
