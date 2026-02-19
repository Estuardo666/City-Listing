'use server'

import { getServerSession } from 'next-auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/action-response'

const updateNameSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
})

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

const updateImageSchema = z.object({
  image: z.string().url('URL de imagen inválida').nullable(),
})

export type UpdateNameInput = z.infer<typeof updateNameSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
export type UpdateImageInput = z.infer<typeof updateImageSchema>

export async function updateNameAction(input: UpdateNameInput): Promise<ActionResponse<{ name: string }>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autenticado' }

    const parsed = updateNameSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
      select: { name: true },
    })

    return { success: true, data: { name: updated.name ?? '' } }
  } catch {
    return { success: false, error: 'Error al actualizar el nombre' }
  }
}

export async function updatePasswordAction(input: UpdatePasswordInput): Promise<ActionResponse<null>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autenticado' }

    const parsed = updatePasswordSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!(user as any)?.password) {
      return { success: false, error: 'Esta cuenta no tiene contraseña configurada (inicio con proveedor externo)' }
    }

    const isValid = await bcrypt.compare(parsed.data.currentPassword, (user as any).password)
    if (!isValid) return { success: false, error: 'La contraseña actual es incorrecta' }

    const hashed = await bcrypt.hash(parsed.data.newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed } as any,
    })

    return { success: true, data: null }
  } catch {
    return { success: false, error: 'Error al actualizar la contraseña' }
  }
}

export async function updateImageAction(input: UpdateImageInput): Promise<ActionResponse<{ image: string | null }>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autenticado' }

    const parsed = updateImageSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: parsed.data.image },
      select: { image: true },
    })

    return { success: true, data: { image: updated.image } }
  } catch {
    return { success: false, error: 'Error al actualizar la imagen de perfil' }
  }
}
