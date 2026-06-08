import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { googleImportJobs } from '@/lib/google/google-import-jobs'
import { GoogleBulkImportSchema } from '@/schemas/google-import'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '20')

    const result = await googleImportJobs.listJobs(page, limit)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error listing jobs:', error)
    return NextResponse.json({ error: 'Error al listar jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = GoogleBulkImportSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validated.error.errors },
        { status: 400 }
      )
    }

    const { places, categoryId, duplicateAction, country, province, city, categories, radius } =
      validated.data

    const job = await googleImportJobs.createJob({
      country,
      province,
      city,
      categories,
      radius,
      totalRecords: places.length,
      userId: session.user.id,
    })

    googleImportJobs
      .processJob(job.id, places, categoryId, session.user.id, duplicateAction)
      .catch((err) => {
        console.error('Job processing error:', err)
      })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Job creado y procesándose en segundo plano',
    })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json({ error: 'Error al crear job' }, { status: 500 })
  }
}
