import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Este correo ya está registrado' },
        { status: 409 }
      )
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
      },
    })

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    )
  }
}
