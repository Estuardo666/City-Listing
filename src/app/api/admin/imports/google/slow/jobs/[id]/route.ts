import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, unauthorized } from '@/lib/api/require-admin'
import { googleSlowImport } from '@/lib/google/google-slow-import'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    if (!session) return unauthorized()

    const { id } = await params
    const job = await googleSlowImport.getJobStatus(id)

    if (!job) {
      return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error getting slow job:', error)
    return NextResponse.json({ error: 'Error al obtener job' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    if (!session) return unauthorized()

    const { id } = await params
    const body = await request.json()

    switch (body.action) {
      case 'pause':
        await googleSlowImport.pauseJob(id)
        return NextResponse.json({ success: true, message: 'Job pausado' })
      case 'resume':
        await googleSlowImport.resumeJob(id)
        return NextResponse.json({ success: true, message: 'Job reanudado' })
      case 'cancel':
        await googleSlowImport.cancelJob(id)
        return NextResponse.json({ success: true, message: 'Job cancelado' })
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al actualizar job'
    console.error('Error updating slow job:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
