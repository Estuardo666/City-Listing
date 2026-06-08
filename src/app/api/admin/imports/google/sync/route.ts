import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { googleHoursSync } from '@/lib/google/google-hours-sync'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const maxRecords = body.maxRecords || 100
    const batchSize = body.batchSize || 20

    const job = await prisma.googleImportJob.create({
      data: {
        country: '',
        province: '',
        city: 'Sincronización',
        categories: '[]',
        radius: 0,
        totalRecords: 0,
        status: 'PENDING',
        createdBy: session.user.id,
      },
    })

    googleHoursSync
      .run(maxRecords, batchSize, session.user.id, job.id)
      .catch((err) => console.error('Sync job error:', err))

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Sincronización iniciada en segundo plano',
    })
  } catch (error) {
    console.error('Error starting sync:', error)
    return NextResponse.json({ error: 'Error al iniciar sincronización' }, { status: 500 })
  }
}
