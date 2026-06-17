import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendWelcomeEmail } from '@/lib/email/templates/welcome'

const verifyCodeSchema = z.object({
  email: z.string().email('Correo inválido'),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
})

const MAX_ATTEMPTS = 3

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = verifyCodeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { email, code } = parsed.data

    // Buscar token de verificación
    const token = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: code,
        },
      },
    })

    if (!token) {
      // Contar intentos previos
      const attempts = await prisma.verificationToken.count({
        where: {
          identifier: email,
          expires: { gt: new Date() },
        },
      })

      if (attempts >= MAX_ATTEMPTS) {
        // Eliminar todos los tokens para forzar reenvío
        await prisma.verificationToken.deleteMany({
          where: { identifier: email },
        })
        await prisma.verificationToken.deleteMany({
          where: { identifier: `pw:${email}` },
        })

        return NextResponse.json(
          { error: 'Demasiados intentos. Solicita un nuevo código.', maxAttempts: true },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: `Código incorrecto. ${MAX_ATTEMPTS - attempts} intento${MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} restante${MAX_ATTEMPTS - attempts !== 1 ? 's' : ''}.` },
        { status: 400 }
      )
    }

    // Verificar expiración
    if (new Date() > token.expires) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      })
      await prisma.verificationToken.deleteMany({
        where: { identifier: `pw:${email}` },
      })

      return NextResponse.json(
        { error: 'El código ha expirado. Solicita un nuevo código.', expired: true },
        { status: 410 }
      )
    }

    // Obtener password hasheado
    const passwordTokens = await prisma.verificationToken.findMany({
      where: {
        identifier: `pw:${email}`,
        expires: { gt: new Date() },
      },
    })

    const passwordToken = passwordTokens[0]

    if (!passwordToken) {
      return NextResponse.json(
        { error: 'Sesión expirada. Vuelve a registrarte.' },
        { status: 400 }
      )
    }

    const hashedPassword = passwordToken.token

    // Verificar que el email no esté registrado (doble check)
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      // Limpiar tokens
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      })
      await prisma.verificationToken.deleteMany({
        where: { identifier: `pw:${email}` },
      })

      return NextResponse.json(
        { error: 'Este correo ya está registrado' },
        { status: 409 }
      )
    }

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: null,
        role: 'USER',
      },
    })

    // Limpiar tokens usados
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })
    await prisma.verificationToken.deleteMany({
      where: { identifier: `pw:${email}` },
    })

    // Enviar welcome email (async, non-blocking)
    sendWelcomeEmail(email, null).catch((err) =>
      console.error('Welcome email error:', err)
    )

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Error al verificar código' },
      { status: 500 }
    )
  }
}
