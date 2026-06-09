import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadBufferToR2, getR2PublicUrl } from '@/lib/storage/r2'
import { recalculateConfidenceScore } from '@/lib/claims/confidence'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 })
    }

    const { id: claimId } = await params

    const claim = await prisma.venueClaim.findUnique({
      where: { id: claimId },
      select: { id: true, userId: true, status: true },
    })

    if (!claim) {
      return NextResponse.json({ success: false, error: 'Reclamo no encontrado.' }, { status: 404 })
    }

    if (claim.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 403 })
    }

    if (claim.status === 'APPROVED' || claim.status === 'REJECTED') {
      return NextResponse.json(
        { success: false, error: 'No se puede modificar un reclamo finalizado.' },
        { status: 400 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'Archivo requerido.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'El archivo no puede superar 5 MB.' },
        { status: 400 },
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o PDF.' },
        { status: 400 },
      )
    }

    // Subir a R2
    const ext = file.name.split('.').pop() ?? 'bin'
    const key = `claims/${claimId}/evidence-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    await uploadBufferToR2({
      key,
      body: buffer,
      contentType: file.type,
    })

    const publicUrl = getR2PublicUrl(key)

    // Actualizar claim
    await prisma.venueClaim.update({
      where: { id: claimId },
      data: {
        evidenceUrl: publicUrl,
        evidenceName: file.name,
      },
    })

    // Recalcular confidence score (+20 por evidencia)
    const score = await recalculateConfidenceScore(claimId)

    return NextResponse.json({
      success: true,
      data: {
        evidenceUrl: publicUrl,
        evidenceName: file.name,
        confidenceScore: score,
        message: 'Evidencia subida correctamente.',
      },
    })
  } catch (error) {
    console.error('Error uploading evidence:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 },
    )
  }
}
