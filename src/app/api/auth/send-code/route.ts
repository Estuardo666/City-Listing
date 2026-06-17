import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'
import { sendVerificationCodeEmail } from '@/lib/email/templates/verification-code'
import { verifyTurnstileToken } from '@/lib/turnstile'

const sendCodeSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  turnstileToken: z.string().min(1, 'Token de verificación requerido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = sendCodeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { email, password, turnstileToken } = parsed.data

    // Verify Turnstile token
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip)

    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: turnstileResult.error ?? 'Verificación de seguridad fallida' },
        { status: 403 }
      )
    }

    // Verificar que el email no esté registrado
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Este correo ya está registrado' },
        { status: 409 }
      )
    }

    // Eliminar tokens anteriores para este email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    // Generar código de 6 dígitos
    const code = String(crypto.randomInt(100000, 999999))

    // Guardar token con expiración de 10 minutos
    const expires = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: code,
        expires,
      },
    })

    // Guardar password temporalmente en un token especial
    // (no podemos guardarlo en verificationToken directamente)
    // Lo hashearemos en verify-code al momento de crear el usuario
    // Por ahora, almacenamos el password hasheado como un token adicional
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.verificationToken.create({
      data: {
        identifier: `pw:${email}`,
        token: hashedPassword,
        expires,
      },
    })

    // Enviar email con código
    await sendVerificationCodeEmail(email, code)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send code error:', error)
    return NextResponse.json(
      { error: 'Error al enviar código' },
      { status: 500 }
    )
  }
}
