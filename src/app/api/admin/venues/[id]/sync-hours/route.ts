import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, unauthorized } from '@/lib/api/require-admin'
import { prisma } from '@/lib/prisma'
import { googleHoursSync } from '@/lib/google/google-hours-sync'

/** Rellena los horarios de un local desde Google Places. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    if (!session) return unauthorized()

    const { id } = await params
    const venue = await prisma.venue.findUnique({
      where: { id },
      select: { id: true, name: true, googlePlaceId: true },
    })
    if (!venue) return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 })
    if (!venue.googlePlaceId) {
      return NextResponse.json({ error: 'El local no tiene googlePlaceId: hay que cargar los horarios a mano' }, { status: 422 })
    }

    // syncVenue reescribe las filas e invalida el cache de explore.
    const result = await googleHoursSync.syncVenue(venue.id, venue.googlePlaceId)
    if (result.action === 'error') {
      return NextResponse.json({ error: result.error ?? 'No se pudo sincronizar' }, { status: 502 })
    }

    return NextResponse.json({ venueId: venue.id, name: venue.name, hoursCount: result.hoursCount ?? 0 })
  } catch (error) {
    console.error('Sync hours error:', error)
    return NextResponse.json({ error: 'Error al sincronizar horarios' }, { status: 500 })
  }
}
