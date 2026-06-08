import { prisma } from '@/lib/prisma'
import type { OsmPlace, DuplicateCheckResult, ImportResult, BulkImportResult } from '@/types/osm-import'

function normalizeString(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

class ImportService {
  validatePlace(place: OsmPlace): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    if (!place.name || place.name.trim().length === 0) errors.push('Nombre requerido')
    if (place.lat == null || place.lon == null) errors.push('Coordenadas requeridas')
    if (place.lat < -90 || place.lat > 90) errors.push('Latitud inválida')
    if (place.lon < -180 || place.lon > 180) errors.push('Longitud inválida')
    return { valid: errors.length === 0, errors }
  }

  async checkDuplicate(place: OsmPlace): Promise<DuplicateCheckResult> {
    const osmIdStr = String(place.osmId)
    const byOsmId = await prisma.venue.findFirst({ where: { osmId: osmIdStr } as any, select: { id: true, name: true, slug: true } })
    if (byOsmId) {
      return { isDuplicate: true, existingVenue: byOsmId, similarity: 100, matchType: 'osm_id' }
    }

    const nearbyVenues = await prisma.$queryRaw<Array<{ id: string; name: string; slug: string; lat: number; lng: number }>>`
      SELECT id, name, slug, lat, lng FROM "Venue"
      WHERE lat IS NOT NULL AND lng IS NOT NULL
        AND ABS(lat - ${place.lat}) < 0.001
        AND ABS(lng - ${place.lon}) < 0.001
    `

    const normalizedName = normalizeString(place.name)
    for (const v of nearbyVenues) {
      const dist = haversineDistance(place.lat, place.lon, v.lat, v.lng)
      if (dist < 50 && normalizeString(v.name) === normalizedName) {
        return { isDuplicate: true, existingVenue: v, similarity: 95, matchType: 'name_location' }
      }
    }

    if (place.website) {
      const byWebsite = await prisma.venue.findFirst({ where: { website: place.website }, select: { id: true, name: true, slug: true } })
      if (byWebsite) return { isDuplicate: true, existingVenue: byWebsite, similarity: 80, matchType: 'website' }
    }

    if (place.phone) {
      const normalizedPhone = place.phone.replace(/[^0-9+]/g, '')
      if (normalizedPhone.length >= 7) {
        const byPhone = await prisma.venue.findFirst({ where: { phone: normalizedPhone }, select: { id: true, name: true, slug: true } })
        if (byPhone) return { isDuplicate: true, existingVenue: byPhone, similarity: 70, matchType: 'phone' }
      }
    }

    return { isDuplicate: false, similarity: 0, matchType: 'none' }
  }

  private buildSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .slice(0, 80)
  }

  async createPlace(place: OsmPlace, categoryIds: string[], userId: string) {
    const slug = `${this.buildSlug(place.name)}-${Date.now().toString(36).slice(-4)}`
    const venue = await prisma.venue.create({
      data: {
        name: place.name,
        slug,
        description: `Importado desde OpenStreetMap: ${place.name}`,
        location: place.address ?? `${place.lat}, ${place.lon}`,
        lat: place.lat,
        lng: place.lon,
        address: place.address,
        phone: place.phone,
        website: place.website,
        email: place.email,
        status: 'PENDING',
        userId,
        osmId: String(place.osmId),
      } as any,
    })

    if (categoryIds.length > 0) {
      await prisma.venueCategory.createMany({
        data: categoryIds.map((categoryId) => ({ venueId: venue.id, categoryId })),
      })
    }

    return venue
  }

  async updatePlace(venueId: string, place: OsmPlace) {
    return prisma.venue.update({
      where: { id: venueId },
      data: {
        name: place.name,
        location: place.address ?? `${place.lat}, ${place.lon}`,
        lat: place.lat,
        lng: place.lon,
        address: place.address,
        phone: place.phone,
        website: place.website,
        email: place.email,
        osmId: String(place.osmId),
      } as any,
    })
  }

  async bulkImport(
    places: OsmPlace[],
    categoryIds: string[],
    userId: string,
    options: { skipDuplicates: boolean; updateExisting: boolean; batchSize: number },
    importId?: string,
    logFn?: (importId: string, message: string, level: string) => Promise<void>
  ): Promise<BulkImportResult> {
    const results: ImportResult[] = []
    let imported = 0
    let updated = 0
    let duplicates = 0
    let errors = 0

    for (let i = 0; i < places.length; i += options.batchSize) {
      const batch = places.slice(i, i + options.batchSize)
      for (const place of batch) {
        try {
          const validation = this.validatePlace(place)
          if (!validation.valid) {
            results.push({ placeId: place.id, action: 'error', error: validation.errors.join(', ') })
            errors++
            continue
          }

          const dupCheck = await this.checkDuplicate(place)

          if (dupCheck.isDuplicate) {
            if (options.updateExisting && dupCheck.existingVenue) {
              await this.updatePlace(dupCheck.existingVenue.id, place)
              results.push({ placeId: place.id, action: 'updated', venueId: dupCheck.existingVenue.id })
              updated++
            } else if (options.skipDuplicates) {
              results.push({ placeId: place.id, action: 'skipped', error: `Duplicado (${dupCheck.matchType})` })
              duplicates++
            } else {
              const venue = await this.createPlace(place, categoryIds, userId)
              results.push({ placeId: place.id, action: 'created', venueId: venue.id })
              imported++
            }
          } else {
            const venue = await this.createPlace(place, categoryIds, userId)
            results.push({ placeId: place.id, action: 'created', venueId: venue.id })
            imported++
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error desconocido'
          results.push({ placeId: place.id, action: 'error', error: msg })
          errors++
          if (importId && logFn) {
            await logFn(importId, `Error importando ${place.name}: ${msg}`, 'ERROR')
          }
        }
      }

      if (importId) {
        await prisma.osmImport.update({
          where: { id: importId },
          data: {
            importedCount: imported,
            duplicateCount: duplicates,
            errorCount: errors,
          },
        })
      }
    }

    return { total: places.length, imported, updated, duplicates, errors, results }
  }
}

export const importService = new ImportService()
