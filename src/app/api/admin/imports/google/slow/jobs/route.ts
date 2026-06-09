import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, unauthorized } from '@/lib/api/require-admin'
import { googleSlowImport, type SlowPlaceData } from '@/lib/google/google-slow-import'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) return unauthorized()

    const host = request.headers.get('host') || ''
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      return NextResponse.json(
        { error: 'La importación lenta solo está disponible en localhost' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { places, categoryIds, duplicateAction, delayMs } = body

    if (!places || !Array.isArray(places) || places.length === 0) {
      return NextResponse.json({ error: 'Se requieren lugares para importar' }, { status: 400 })
    }

    const jobId = await googleSlowImport.createJob({
      places: places as SlowPlaceData[],
      categoryIds: categoryIds || [],
      duplicateAction: duplicateAction || 'skip',
      delayMs: delayMs ?? 72000,
      userId: session.user.id,
    })

    await googleSlowImport.startJob(jobId)

    return NextResponse.json({ success: true, jobId })
  } catch (error) {
    console.error('Error creating slow import job:', error)
    return NextResponse.json({ error: 'Error al crear job' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) return unauthorized()

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '20')

    const { prisma } = await import('@/lib/prisma')
    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      prisma.googleImportJob.findMany({
        where: { jobType: 'SLOW_IMPORT' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.googleImportJob.count({ where: { jobType: 'SLOW_IMPORT' } }),
    ])

    return NextResponse.json({ jobs, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Error listing slow jobs:', error)
    return NextResponse.json({ error: 'Error al listar jobs' }, { status: 500 })
  }
}
