import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncService } from '@/lib/osm/sync-service'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { type, importId } = await request.json()

    if (!['FULL', 'INCREMENTAL', 'UPDATE'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de sincronización inválido' }, { status: 400 })
    }

    const job = await syncService.createSyncJob(type, importId)
    await syncService.updateJobProgress(job.id, { status: 'RUNNING', startedAt: new Date() })

    const venues = await prisma.venue.findMany({
      where: { osmId: { not: null } } as any,
      select: { id: true },
    })

    await syncService.updateJobProgress(job.id, { total: venues.length })

    let processed = 0
    for (const venue of venues) {
      try {
        await syncService.syncPlace(venue.id)
        processed++
        const progress = Math.round((processed / venues.length) * 100)
        await syncService.updateJobProgress(job.id, { progress, processed })
      } catch {
        processed++
      }
    }

    if (type === 'FULL' && importId) {
      await syncService.markRemovedPlaces(importId)
    }

    await syncService.updateJobProgress(job.id, { status: 'COMPLETED', finishedAt: new Date(), progress: 100 })

    return NextResponse.json({ success: true, jobId: job.id, status: 'COMPLETED', processed, total: venues.length })
  } catch (error) {
    console.error('Error in sync:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error en sincronización' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const jobs = await prisma.osmSyncJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        import: { select: { id: true, city: true, country: true } },
      },
    })

    return NextResponse.json({ data: jobs })
  } catch (error) {
    console.error('Error fetching sync jobs:', error)
    return NextResponse.json({ error: 'Error al obtener jobs' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { jobId, action } = await request.json()

    if (!jobId || !action) {
      return NextResponse.json({ error: 'jobId y action requeridos' }, { status: 400 })
    }

    switch (action) {
      case 'pause':
        await syncService.pauseJob(jobId)
        break
      case 'resume':
        await syncService.resumeJob(jobId)
        break
      case 'cancel':
        await syncService.cancelJob(jobId)
        break
      default:
        return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating sync job:', error)
    return NextResponse.json({ error: 'Error al actualizar job' }, { status: 500 })
  }
}
