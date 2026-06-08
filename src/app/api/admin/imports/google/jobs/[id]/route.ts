import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { googleImportJobs } from '@/lib/google/google-import-jobs'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const job = await googleImportJobs.getJobStatus(id)

    if (!job) {
      return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error getting job:', error)
    return NextResponse.json({ error: 'Error al obtener job' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    if (body.action === 'cancel') {
      await googleImportJobs.cancelJob(id)
      return NextResponse.json({ success: true, message: 'Job cancelado' })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json({ error: 'Error al actualizar job' }, { status: 500 })
  }
}
