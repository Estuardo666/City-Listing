import { prisma } from '@/lib/prisma'
import { googlePlacesService } from '@/lib/google-places'
import { normalizeOpeningHours } from './google-places-importer'

export interface SyncResult {
  venueId: string
  name: string
  action: 'updated' | 'skipped' | 'error'
  website?: string | null
  hoursCount?: number
  error?: string
}

export interface BatchResult {
  total: number
  updated: number
  skipped: number
  errors: number
  results: SyncResult[]
}

export interface RunResult {
  processed: number
  updated: number
  skipped: number
  errors: number
  elapsed: number
}

function normalizeWebsite(details: any): string | null {
  return details.websiteUri || null
}

class GoogleHoursSyncService {
  async getVenuesForSync(limit: number = 100): Promise<Array<{ id: string; googlePlaceId: string | null; name: string }>> {
    return prisma.venue.findMany({
      where: {
        googlePlaceId: { not: null },
      } as any,
      orderBy: { hoursLastSync: 'asc' },
      take: limit,
      select: { id: true, googlePlaceId: true, name: true },
    })
  }

  async syncVenue(venueId: string, googlePlaceId: string): Promise<SyncResult> {
    try {
      const details = await googlePlacesService.getPlaceDetails(googlePlaceId)
      if (!details) {
        return { venueId, name: '', action: 'error', error: 'No se encontraron detalles' }
      }

      const website = normalizeWebsite(details)
      const hours = normalizeOpeningHours(details)
      const now = new Date()

      await prisma.venue.update({
        where: { id: venueId },
        data: {
          website,
          sourceLastSync: now,
          hoursLastSync: hours.length > 0 ? now : undefined,
        } as any,
      })

      if (hours.length > 0) {
        await prisma.venueBusinessHours.deleteMany({ where: { venueId } })
        await prisma.venueBusinessHours.createMany({
          data: hours.map((h) => ({ ...h, venueId })),
        })
      }

      return {
        venueId,
        name: (details as any).displayName?.text || '',
        action: 'updated',
        website,
        hoursCount: hours.length,
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      return { venueId, name: '', action: 'error', error: msg }
    }
  }

  async syncBatch(
    venues: Array<{ id: string; googlePlaceId: string | null; name: string }>,
    batchSize: number = 20,
    delayMs: number = 2000,
    jobId?: string
  ): Promise<BatchResult> {
    const results: SyncResult[] = []
    let updated = 0
    let skipped = 0
    let errors = 0

    for (let i = 0; i < venues.length; i += batchSize) {
      const batch = venues.slice(i, i + batchSize)

      for (const venue of batch) {
        if (!venue.googlePlaceId) {
          results.push({ venueId: venue.id, name: venue.name, action: 'skipped', error: 'Sin Google Place ID' })
          skipped++
          continue
        }

        const result = await this.syncVenue(venue.id, venue.googlePlaceId)
        results.push(result)

        if (result.action === 'updated') updated++
        else if (result.action === 'skipped') skipped++
        else errors++
      }

      if (jobId) {
        await prisma.googleImportJob.update({
          where: { id: jobId },
          data: {
            processedRecords: Math.min(i + batchSize, venues.length),
            importedRecords: updated,
            duplicateRecords: skipped,
            errorRecords: errors,
          },
        })

        await prisma.googleImportLog.create({
          data: {
            jobId,
            level: 'INFO',
            message: `Lote ${Math.floor(i / batchSize) + 1} procesado: ${Math.min(i + batchSize, venues.length)}/${venues.length}`,
          },
        })
      }

      if (i + batchSize < venues.length && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    return { total: venues.length, updated, skipped, errors, results }
  }

  async run(
    maxRecords: number = 100,
    batchSize: number = 20,
    userId?: string,
    jobId?: string
  ): Promise<RunResult> {
    const start = Date.now()

    const venues = await this.getVenuesForSync(maxRecords)

    if (venues.length === 0) {
      return { processed: 0, updated: 0, skipped: 0, errors: 0, elapsed: 0 }
    }

    if (jobId) {
      await prisma.googleImportJob.update({
        where: { id: jobId },
        data: { status: 'RUNNING', startedAt: new Date(), totalRecords: venues.length },
      })
      await prisma.googleImportLog.create({
        data: { jobId, level: 'INFO', message: `Iniciando sincronización de ${venues.length} locales` },
      })
    }

    const result = await this.syncBatch(venues, batchSize, 2000, jobId)

    if (jobId) {
      await prisma.googleImportJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          finishedAt: new Date(),
          processedRecords: result.total,
          importedRecords: result.updated,
          duplicateRecords: result.skipped,
          errorRecords: result.errors,
        },
      })
      await prisma.googleImportLog.create({
        data: {
          jobId,
          level: 'INFO',
          message: `Sincronización completada: ${result.updated} actualizados, ${result.skipped} omitidos, ${result.errors} errores`,
        },
      })
    }

    return {
      processed: result.total,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
      elapsed: Date.now() - start,
    }
  }
}

export const googleHoursSync = new GoogleHoursSyncService()
