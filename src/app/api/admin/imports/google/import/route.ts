import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { googlePlacesImporter } from '@/lib/google/google-places-importer'
import { GoogleImportSchema } from '@/schemas/google-import'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = GoogleImportSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validated.error.errors },
        { status: 400 }
      )
    }

    const { places, categoryId, duplicateAction } = validated.data
    const results = []

    for (const place of places) {
      try {
        const result = await googlePlacesImporter.savePlace(
          place,
          categoryId,
          session.user.id,
          duplicateAction
        )
        results.push({ placeId: place.google_place_id, ...result })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido'
        results.push({
          placeId: place.google_place_id,
          action: 'error' as const,
          error: msg,
        })
      }
    }

    const imported = results.filter((r) => r.action === 'created' || r.action === 'updated').length
    const skipped = results.filter((r) => r.action === 'skipped').length
    const errors = results.filter((r) => r.action === 'error').length

    return NextResponse.json({
      success: true,
      stats: { total: places.length, imported, skipped, errors },
      results,
    })
  } catch (error) {
    console.error('Error in import:', error)
    return NextResponse.json({ error: 'Error al importar' }, { status: 500 })
  }
}
