import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { claimSubmitSchema } from '@/schemas/venue-claim.schema'
import { sendClaimVerificationEmail } from '@/lib/email/templates/claim-verification'
import { recalculateConfidenceScore } from '@/lib/claims/confidence'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado.' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = claimSubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
        { status: 400 },
      )
    }

    const { venueId, claimerName, claimerEmail, claimerPhone, claimerRole, message } = parsed.data

    // Verificar que el venue existe
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, userId: true, slug: true, name: true },
    })
    if (!venue) {
      return NextResponse.json({ success: false, error: 'Local no encontrado.' }, { status: 404 })
    }

    // No puede reclamar su propio venue
    if (venue.userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Ya eres el dueño de este local.' },
        { status: 400 },
      )
    }

    // Verificar si ya tiene un claim activo (PENDING o VERIFIED)
    const existingClaim = await prisma.venueClaim.findFirst({
      where: {
        venueId,
        userId: session.user.id,
        status: { in: ['PENDING', 'VERIFIED'] },
      },
    })
    if (existingClaim) {
      return NextResponse.json(
        { success: false, error: 'Ya tienes un reclamo activo para este local.' },
        { status: 400 },
      )
    }

    // Generar código y crear claim
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    console.log(`📧 Creating claim for ${claimerName} <${claimerEmail}> on venue ${venue.name}`)
    console.log(`🔑 Generated verification code: ${code}`)

    const claim = await prisma.venueClaim.create({
      data: {
        venueId,
        userId: session.user.id,
        claimerName,
        claimerEmail,
        claimerPhone,
        claimerRole,
        message,
        verificationCode: code,
        codeExpiresAt: expiresAt,
        attempts: 0,
        verified: false,
        status: 'PENDING',
      },
    })

    // Calcular score inicial (usuario registrado = +20)
    await recalculateConfidenceScore(claim.id)

    // Enviar email de verificación
    console.log(`📤 Sending verification email to ${claimerEmail}...`)
    const emailResult = await sendClaimVerificationEmail(claimerEmail, claimerName, code)

    if (!emailResult.success) {
      console.error('❌ Failed to send verification email:', JSON.stringify(emailResult.error, null, 2))
      // Still return success - user can resend later
      return NextResponse.json({
        success: true,
        data: {
          claimId: claim.id,
          message: 'Reclamo creado. Si no recibes el correo, puedes reenviarlo.',
          emailSent: false,
        },
      })
    }

    console.log(`✅ Verification email sent successfully to ${claimerEmail}`)

    return NextResponse.json({
      success: true,
      data: {
        claimId: claim.id,
        message: 'Código de verificación enviado a tu correo.',
        emailSent: true,
      },
    })
  } catch (error) {
    console.error('❌ Error in claim submit:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 },
    )
  }
}
