import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendClaimVerificationEmail } from '@/lib/email/templates/claim-verification'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const resendSchema = z.object({
  claimId: z.string().min(1, 'ID requerido'),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = resendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'ID requerido.' },
        { status: 400 },
      )
    }

    const { claimId } = parsed.data

    const claim = await prisma.venueClaim.findUnique({
      where: { id: claimId },
      select: {
        id: true,
        userId: true,
        claimerEmail: true,
        claimerName: true,
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
        data: { message: 'Ya verificado. No necesitas reenviar el código.' },
      })
    }

    // Generar nuevo código
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // Actualizar claim con nuevo código y resetear intentos
    await prisma.venueClaim.update({
      where: { id: claimId },
      data: {
        verificationCode: code,
        codeExpiresAt: expiresAt,
        attempts: 0, // Resetear intentos
      },
    })

    // Enviar email
    console.log(`📧 Sending verification code to ${claim.claimerEmail} for claim ${claimId}`)
    const emailResult = await sendClaimVerificationEmail(claim.claimerEmail, claim.claimerName, code)

    if (!emailResult.success) {
      console.error('❌ Error sending verification email:', JSON.stringify(emailResult.error))
      return NextResponse.json(
        { success: false, error: 'Error al enviar el correo. Intenta de nuevo.' },
        { status: 500 },
      )
    }

    console.log(`✅ Verification code sent successfully to ${claim.claimerEmail}`)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Nuevo código enviado a tu correo.',
        expiresAt: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error in resend code:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 },
    )
  }
}
