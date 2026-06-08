import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { importService } from '@/lib/osm/import-service'
import type { OsmPlace } from '@/types/osm-import'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { place, categoryIds, importOptions } = await request.json()

    if (!place || !categoryIds?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const osmPlace = place as OsmPlace

    const validation = importService.validatePlace(osmPlace)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const dupCheck = await importService.checkDuplicate(osmPlace)

    if (dupCheck.isDuplicate) {
      if (importOptions?.updateExisting && dupCheck.existingVenue) {
        const venue = await importService.updatePlace(dupCheck.existingVenue.id, osmPlace)
        return NextResponse.json({ success: true, venue, action: 'updated' })
      }
      if (importOptions?.skipDuplicates) {
        return NextResponse.json({ success: true, action: 'skipped', duplicate: dupCheck })
      }
    }

    const venue = await importService.createPlace(osmPlace, categoryIds[0], session.user.id)
    return NextResponse.json({ success: true, venue, action: 'created' })
  } catch (error) {
    console.error('Error importing OSM place:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al importar' }, { status: 500 })
  }
}
