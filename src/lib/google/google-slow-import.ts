import { prisma } from '@/lib/prisma'
import { googlePlacesService } from '@/lib/google-places'
import { normalizeOpeningHours } from './google-places-importer'
import { getCategoriesFromGoogleTypes } from './google-type-mapper'

function normalizeWebsite(details: any): string | null {
  return details.websiteUri || null
}

function buildSlug(name: string): string {
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

async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = buildSlug(name)
  let candidate = baseSlug
  let suffix = 1
  while (true) {
    const existing = await prisma.venue.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!existing) return candidate
    suffix++
    candidate = `${baseSlug}-${suffix}`
  }
}

export interface SlowPlaceData {
  google_place_id: string
  name: string
  category: string
  address: string
  phone: string | null
  lat: number
  lng: number
  categoryIds?: string[]
}

export interface SlowJobStatus {
  id: string
  status: string
  totalRecords: number
  processedRecords: number
  importedRecords: number
  duplicateRecords: number
  errorRecords: number
  currentBatchIndex: number
  delayMs: number
  startedAt: Date | null
  finishedAt: Date | null
  pausedAt: Date | null
  progress: number
  elapsedTime: number
  estimatedTimeRemaining: number
  logs: Array<{ id: string; level: string; message: string; createdAt: Date }>
}

class GoogleSlowImportService {
  async createJob(params: {
    places: SlowPlaceData[]
    categoryIds: string[]
    duplicateAction: 'skip' | 'update'
    delayMs: number
    userId: string
  }): Promise<string> {
    const job = await prisma.googleImportJob.create({
      data: {
        country: '',
        province: '',
        city: 'Importación lenta',
        categories: JSON.stringify(params.categoryIds),
        radius: 0,
        totalRecords: params.places.length,
        status: 'PENDING',
        jobType: 'SLOW_IMPORT',
        duplicateAction: params.duplicateAction,
        delayMs: params.delayMs,
        batchData: JSON.stringify(params.places),
        createdBy: params.userId,
      },
    })

    return job.id
  }

  async startJob(jobId: string): Promise<void> {
    await prisma.googleImportJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    })

    await this.log(jobId, 'INFO', 'Importación lenta iniciada')

    this.processLoop(jobId).catch((err) => {
      console.error('Slow import job error:', err)
      prisma.googleImportJob
        .update({
          where: { id: jobId },
          data: { status: 'FAILED', finishedAt: new Date() },
        })
        .catch(() => {})
    })
  }

  async pauseJob(jobId: string): Promise<void> {
    const job = await prisma.googleImportJob.findUnique({ where: { id: jobId } })
    if (!job) throw new Error('Job no encontrado')
    if (job.status !== 'RUNNING') throw new Error('El job no se puede pausar')

    await prisma.googleImportJob.update({
      where: { id: jobId },
      data: { status: 'PAUSED', pausedAt: new Date() },
    })
    await this.log(jobId, 'WARNING', 'Importación pausada por el usuario')
  }

  async resumeJob(jobId: string): Promise<void> {
    const job = await prisma.googleImportJob.findUnique({ where: { id: jobId } })
    if (!job) throw new Error('Job no encontrado')
    if (job.status !== 'PAUSED') throw new Error('El job no está pausado')

    await prisma.googleImportJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', pausedAt: null },
    })
    await this.log(jobId, 'INFO', 'Importación reanudada')

    this.processLoop(jobId).catch((err) => {
      console.error('Slow import resume error:', err)
    })
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = await prisma.googleImportJob.findUnique({ where: { id: jobId } })
    if (!job) throw new Error('Job no encontrado')
    if (job.status !== 'RUNNING' && job.status !== 'PENDING' && job.status !== 'PAUSED') {
      throw new Error('El job no se puede cancelar')
    }

    await prisma.googleImportJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED', finishedAt: new Date() },
    })
    await this.log(jobId, 'WARNING', 'Importación cancelada. Los borradores se conservan.')
  }

  async getJobStatus(jobId: string): Promise<SlowJobStatus | null> {
    const job = await prisma.googleImportJob.findUnique({
      where: { id: jobId },
      include: { logs: { orderBy: { createdAt: 'desc' }, take: 50 } },
    })
    if (!job) return null

    const elapsedTime = job.startedAt
      ? (job.finishedAt || new Date()).getTime() - job.startedAt.getTime()
      : 0

    const progress = job.totalRecords > 0
      ? (job.processedRecords / job.totalRecords) * 100
      : 0

    const estimatedTimeRemaining =
      progress > 0 && job.status === 'RUNNING'
        ? (elapsedTime / progress) * (100 - progress)
        : 0

    return {
      ...job,
      progress,
      elapsedTime,
      estimatedTimeRemaining,
    }
  }

  private async processLoop(jobId: string): Promise<void> {
    while (true) {
      const job = await prisma.googleImportJob.findUnique({ where: { id: jobId } })
      if (!job || job.status !== 'RUNNING') return

      const places: SlowPlaceData[] = JSON.parse(job.batchData || '[]')
      const currentIndex = job.currentBatchIndex

      if (currentIndex >= places.length) {
        await prisma.googleImportJob.update({
          where: { id: jobId },
          data: { status: 'COMPLETED', finishedAt: new Date() },
        })
        await this.log(jobId, 'INFO', `Importación completada: ${job.importedRecords} importados`)
        return
      }

      const place = places[currentIndex]
      await this.processOnePlace(jobId, place, job.duplicateAction)

      const updated = await prisma.googleImportJob.update({
        where: { id: jobId },
        data: {
          processedRecords: { increment: 1 },
          currentBatchIndex: { increment: 1 },
        },
      })

      if (currentIndex + 1 >= places.length) {
        await prisma.googleImportJob.update({
          where: { id: jobId },
          data: { status: 'COMPLETED', finishedAt: new Date() },
        })
        await this.log(
          jobId,
          'INFO',
          `Importación completada: ${updated.importedRecords} importados, ${updated.duplicateRecords} duplicados, ${updated.errorRecords} errores`
        )
        return
      }

      if (job.delayMs > 0) {
        await new Promise((r) => setTimeout(r, job.delayMs))
      }
    }
  }

  private async processOnePlace(
    jobId: string,
    place: SlowPlaceData,
    duplicateAction: string
  ): Promise<void> {
    try {
      const details = await googlePlacesService.getPlaceDetails(place.google_place_id)
      const website = normalizeWebsite(details)
      const hours = normalizeOpeningHours(details)
      const now = new Date()

      const existingByPlaceId = await prisma.venue.findFirst({
        where: { googlePlaceId: place.google_place_id } as any,
        select: { id: true },
      })

      if (existingByPlaceId) {
        if (duplicateAction === 'update') {
          await prisma.venue.update({
            where: { id: existingByPlaceId.id },
            data: {
              name: place.name,
              location: place.address,
              lat: place.lat,
              lng: place.lng,
              address: place.address,
              phone: place.phone,
              website,
              sourceLastSync: now,
              hoursLastSync: hours.length > 0 ? now : undefined,
            } as any,
          })

          if (hours.length > 0) {
            await prisma.venueBusinessHours.deleteMany({ where: { venueId: existingByPlaceId.id } })
            await prisma.venueBusinessHours.createMany({
              data: hours.map((h) => ({ ...h, venueId: existingByPlaceId.id })),
            })
          }

          await prisma.googleImportJob.update({
            where: { id: jobId },
            data: { importedRecords: { increment: 1 } },
          })
          await this.log(jobId, 'INFO', `Actualizado: ${place.name}`)
        } else {
          await prisma.googleImportJob.update({
            where: { id: jobId },
            data: { duplicateRecords: { increment: 1 } },
          })
          await this.log(jobId, 'INFO', `Duplicado omitido: ${place.name}`)
        }
        return
      }

      const slug = await generateUniqueSlug(place.name)
      const categoryIds = place.categoryIds || []

      const categoryResult = await getCategoriesFromGoogleTypes([place.category])
      const resolvedSlugs = categoryResult.categorySlugs
      let resolvedCategoryIds: string[] = []
      if (resolvedSlugs.length > 0) {
        const cats = await prisma.category.findMany({
          where: { slug: { in: resolvedSlugs } },
          select: { id: true },
        })
        resolvedCategoryIds = cats.map((c) => c.id)
      }
      const finalCategoryIds = categoryIds.length > 0 ? categoryIds : resolvedCategoryIds

      const venue = await prisma.venue.create({
        data: {
          name: place.name,
          slug,
          description: '',
          location: place.address || `${place.lat}, ${place.lng}`,
          lat: place.lat,
          lng: place.lng,
          address: place.address,
          phone: place.phone,
          website,
          status: 'DRAFT',
          userId: (await prisma.googleImportJob.findUnique({ where: { id: jobId } }))!.createdBy,
          googlePlaceId: place.google_place_id,
          sourceLastSync: now,
          hoursLastSync: hours.length > 0 ? now : null,
        } as any,
      })

      if (hours.length > 0) {
        await prisma.venueBusinessHours.createMany({
          data: hours.map((h) => ({ ...h, venueId: venue.id })),
        })
      }

      if (finalCategoryIds.length > 0) {
        await prisma.venueCategory.createMany({
          data: finalCategoryIds.map((categoryId) => ({ venueId: venue.id, categoryId })),
        })
      }

      await prisma.googleImportJob.update({
        where: { id: jobId },
        data: { importedRecords: { increment: 1 } },
      })
      await this.log(jobId, 'INFO', `Importado (borrador): ${place.name}`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      await prisma.googleImportJob.update({
        where: { id: jobId },
        data: { errorRecords: { increment: 1 } },
      })
      await this.log(jobId, 'ERROR', `Error importando ${place.name}: ${msg}`)
    }
  }

  private async log(jobId: string, level: string, message: string): Promise<void> {
    await prisma.googleImportLog.create({
      data: { jobId, level, message },
    })
  }
}

export const googleSlowImport = new GoogleSlowImportService()
