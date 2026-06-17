import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyTurnstileToken } from '@/lib/turnstile'

const signinVerifySchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
  turnstileToken: z.string().min(1, 'Token de verificación requerido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = signinVerifySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { turnstileToken } = parsed.data

    // Verify Turnstile token
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip)

    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: turnstileResult.error ?? 'Verificación de seguridad fallida' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signin verify error:', error)
    return NextResponse.json(
      { error: 'Error al verificar seguridad' },
      { status: 500 }
    )
  }
}
