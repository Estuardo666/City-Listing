import { prisma } from '@/lib/prisma'
import { googlePlacesImporter } from './google-places-importer'
import type { GooglePlaceNormalized, GoogleImportJobStatus } from '@/types/google-import'

class GoogleImportJobs {
  async createJob(params: {
    country: string
    province: string
    city: string
    categories: string[]
    radius: number
    totalRecords: number
    userId: string
  }) {
    return prisma.googleImportJob.create({
      data: {
        country: params.country,
        province: params.province,
        city: params.city,
        categories: JSON.stringify(params.categories),
        radius: params.radius,
        totalRecords: params.totalRecords,
        status: 'PENDING',
        createdBy: params.userId,
      },
    })
  }

  async processJob(
    jobId: string,
    places: GooglePlaceNormalized[],
    categoryId: string,
    userId: string,
    duplicateAction: 'skip' | 'update'
  ) {
    const batchSize = 50
    let imported = 0
    let duplicates = 0
    let errors = 0

    await prisma.googleImportJob.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        totalRecords: places.length,
      },
    })

    await this.log(jobId, 'INFO', `Iniciando importación de ${places.length} registros`)

    for (let i = 0; i < places.length; i += batchSize) {
      const batch = places.slice(i, i + batchSize)

      for (const place of batch) {
        try {
          const result = await googlePlacesImporter.savePlace(place, categoryId, userId, duplicateAction)

          if (result.action === 'created') {
            imported++
            await this.log(jobId, 'INFO', `Importado: ${place.name}`)
          } else if (result.action === 'skipped') {
            duplicates++
            await this.log(jobId, 'INFO', `Duplicado omitido: ${place.name}`)
          } else if (result.action === 'updated') {
            imported++
            await this.log(jobId, 'INFO', `Actualizado: ${place.name}`)
          }
        } catch (error) {
          errors++
          const msg = error instanceof Error ? error.message : 'Error desconocido'
          await this.log(jobId, 'ERROR', `Error importando ${place.name}: ${msg}`)
        }
      }

      await prisma.googleImportJob.update({
        where: { id: jobId },
        data: {
          processedRecords: Math.min(i + batchSize, places.length),
          importedRecords: imported,
          duplicateRecords: duplicates,
          errorRecords: errors,
        },
      })
    }

    await prisma.googleImportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
        processedRecords: places.length,
        importedRecords: imported,
        duplicateRecords: duplicates,
        errorRecords: errors,
      },
    })

    await this.log(
      jobId,
      'INFO',
      `Importación completada: ${imported} importados, ${duplicates} duplicados, ${errors} errores`
    )
  }

  async cancelJob(jobId: string) {
    const job = await prisma.googleImportJob.findUnique({ where: { id: jobId } })
    if (!job) throw new Error('Job no encontrado')
    if (job.status !== 'PENDING' && job.status !== 'RUNNING') {
      throw new Error('El job no se puede cancelar')
    }

    await prisma.googleImportJob.update({
      where: { id: jobId },
      data: {
        status: 'CANCELLED',
        finishedAt: new Date(),
      },
    })
    await this.log(jobId, 'WARNING', 'Importación cancelada por el usuario')
  }

  async getJobStatus(jobId: string): Promise<GoogleImportJobStatus | null> {
    const job = await prisma.googleImportJob.findUnique({
      where: { id: jobId },
      include: { logs: { orderBy: { createdAt: 'desc' }, take: 100 } },
    })

    if (!job) return null

    const elapsedTime = job.startedAt
      ? (job.finishedAt || new Date()).getTime() - job.startedAt.getTime()
      : 0

    const progress = job.totalRecords > 0 ? (job.processedRecords / job.totalRecords) * 100 : 0

    const estimatedTimeRemaining =
      progress > 0 && job.status === 'RUNNING' ? (elapsedTime / progress) * (100 - progress) : 0

    return {
      ...job,
      progress,
      elapsedTime,
      estimatedTimeRemaining,
    }
  }

  async listJobs(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit
    const [jobs, total] = await Promise.all([
      prisma.googleImportJob.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.googleImportJob.count(),
    ])

    return {
      jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  private async log(jobId: string, level: string, message: string, metadata?: unknown) {
    await prisma.googleImportLog.create({
      data: {
        jobId,
        level,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  }
}

export const googleImportJobs = new GoogleImportJobs()
