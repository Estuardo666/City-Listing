import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { overpassService } from '@/lib/osm/overpass-service'
import { importService } from '@/lib/osm/import-service'
import { OsmSearchSchema } from '@/schemas/osm-import'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    const radius = Number(searchParams.get('radius') ?? '5000')
    const categories = searchParams.get('categories')?.split(',') ?? []

    const parsed = OsmSearchSchema.safeParse({ city, country, radius, categories })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: parsed.error.errors }, { status: 400 })
    }

    const config = await prisma.osmConfig.findFirst()
    if (config) {
      overpassService.configure({
        url: config.overpassUrl,
        timeout: config.timeout,
        userAgent: config.userAgent,
      })
    }

    const coordinates = await overpassService.geocodeCity(parsed.data.city, parsed.data.country)
    if (!coordinates) {
      return NextResponse.json({ error: `No se pudo geolocalizar: ${parsed.data.city}, ${parsed.data.country}` }, { status: 400 })
    }

    const places = await overpassService.searchPlaces({ ...parsed.data, coordinates })

    const duplicateChecks = await Promise.all(places.map((p) => importService.checkDuplicate(p)))
    const placesWithDupStatus = places.map((place, i) => ({
      ...place,
      isDuplicate: duplicateChecks[i].isDuplicate,
      duplicateInfo: duplicateChecks[i].isDuplicate ? duplicateChecks[i] : undefined,
    }))

    const duplicates = duplicateChecks.filter((d) => d.isDuplicate).length

    const importRecord = await prisma.osmImport.create({
      data: {
        city: parsed.data.city,
        country: parsed.data.country,
        categories: JSON.stringify(parsed.data.categories),
        radius: parsed.data.radius,
        status: 'PENDING',
        foundCount: places.length,
        duplicateCount: duplicates,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: placesWithDupStatus,
      total: places.length,
      duplicates,
      importId: importRecord.id,
      coordinates,
    })
  } catch (error) {
    console.error('Error searching OSM:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al buscar lugares' }, { status: 500 })
  }
}
