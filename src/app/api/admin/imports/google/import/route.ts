import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

    const job = await prisma.googleImportJob.create({
      data: {
        country: '',
        province: '',
        city: body.address || '',
        categories: JSON.stringify(body.categories || []),
        radius: body.radius || 0,
        totalRecords: places.length,
        status: 'RUNNING',
        startedAt: new Date(),
        createdBy: session.user.id,
      },
    })

    await prisma.googleImportLog.create({
      data: {
        jobId: job.id,
        level: 'INFO',
        message: `Iniciando importación directa de ${places.length} registros`,
      },
    })

    const results = []
    let imported = 0
    let duplicates = 0
    let errors = 0

    for (const place of places) {
      try {
        const result = await googlePlacesImporter.savePlace(
          place,
          categoryId,
          session.user.id,
          duplicateAction
        )
        results.push({ placeId: place.google_place_id, ...result })

        if (result.action === 'created' || result.action === 'updated') {
          imported++
          await prisma.googleImportLog.create({
            data: {
              jobId: job.id,
              level: 'INFO',
              message: `${result.action === 'created' ? 'Importado' : 'Actualizado'}: ${place.name}`,
            },
          })
        } else if (result.action === 'skipped') {
          duplicates++
          await prisma.googleImportLog.create({
            data: {
              jobId: job.id,
              level: 'INFO',
              message: `Duplicado omitido: ${place.name}`,
            },
          })
        }
      } catch (error) {
        errors++
        const msg = error instanceof Error ? error.message : 'Error desconocido'
        results.push({
          placeId: place.google_place_id,
          action: 'error' as const,
          error: msg,
        })
        await prisma.googleImportLog.create({
          data: {
            jobId: job.id,
            level: 'ERROR',
            message: `Error importando ${place.name}: ${msg}`,
          },
        })
      }
    }

    await prisma.googleImportJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
        processedRecords: places.length,
        importedRecords: imported,
        duplicateRecords: duplicates,
        errorRecords: errors,
      },
    })

    await prisma.googleImportLog.create({
      data: {
        jobId: job.id,
        level: 'INFO',
        message: `Importación completada: ${imported} importados, ${duplicates} duplicados, ${errors} errores`,
      },
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      stats: { total: places.length, imported, skipped: duplicates, errors },
      results,
    })
  } catch (error) {
    console.error('Error in import:', error)
    return NextResponse.json({ error: 'Error al importar' }, { status: 500 })
  }
}
