import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { claimVerifySchema } from '@/schemas/venue-claim.schema'
import { recalculateConfidenceScore } from '@/lib/claims/confidence'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = claimVerifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
        { status: 400 },
      )
    }

    const { claimId, code } = parsed.data

    const claim = await prisma.venueClaim.findUnique({
      where: { id: claimId },
      select: {
        id: true,
        userId: true,
        verificationCode: true,
        codeExpiresAt: true,
        attempts: true,
        verified: true,
        status: true,
      },
    })

    if (!claim) {
      return NextResponse.json({ success: false, error: 'Reclamo no encontrado.' }, { status: 404 })
    }

    if (claim.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 403 })
    }

    if (claim.verified) {
      return NextResponse.json({
        success: true,
        data: { message: 'Ya verificado.', verified: true },
      })
    }

    // Validar intentos
    if (claim.attempts >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Demasiados intentos. Solicita un nuevo código.',
        },
        { status: 429 },
      )
    }

    // Validar expiración
    if (!claim.codeExpiresAt || new Date() > claim.codeExpiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'El código ha expirado. Solicita un nuevo código.',
        },
        { status: 410 },
      )
    }

    // Validar código
    if (claim.verificationCode !== code) {
      // Incrementar intentos
      await prisma.venueClaim.update({
        where: { id: claimId },
        data: { attempts: { increment: 1 } },
      })

      const remaining = 4 - claim.attempts
      return NextResponse.json(
        {
          success: false,
          error: `Código incorrecto. ${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}.`,
        },
        { status: 400 },
      )
    }

    // Código correcto → marcar como verificado
    await prisma.venueClaim.update({
      where: { id: claimId },
      data: {
        verified: true,
        status: 'VERIFIED',
      },
    })

    // Recalcular confidence score (+40 por verificación)
    const score = await recalculateConfidenceScore(claimId)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Correo verificado correctamente.',
        verified: true,
        confidenceScore: score,
      },
    })
  } catch (error) {
    console.error('Error in claim verify:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 },
    )
  }
}
