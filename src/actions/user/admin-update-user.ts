'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ActionResponse } from '@/types/action-response'

const updateRoleSchema = z.object({
  userId: z.string().min(1, 'ID inválido'),
  role: z.enum(['USER', 'ADMIN']),
})

export async function updateUserRoleAction(input: unknown): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'No autorizado. Solo administradores pueden cambiar roles.',
      }
    }

    const parsed = updateRoleSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    if (parsed.data.userId === session.user.id) {
      return {
        success: false,
        error: 'No puedes cambiar tu propio rol.',
      }
    }

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { role: parsed.data.role },
    })

    revalidatePath('/admin/usuarios')
    revalidatePath('/admin')

    return { success: true }
  } catch {
    return {
      success: false,
      error: 'No se pudo actualizar el rol. Intenta nuevamente.',
    }
  }
}

const updateNameSchema = z.object({
  userId: z.string().min(1, 'ID inválido'),
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(60, 'Máximo 60 caracteres'),
})

export async function adminUpdateUserNameAction(input: unknown): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'No autorizado.',
      }
    }

    const parsed = updateNameSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { name: parsed.data.name },
    })

    revalidatePath('/admin/usuarios')
    revalidatePath(`/admin/usuarios/${parsed.data.userId}/editar`)

    return { success: true }
  } catch {
    return {
      success: false,
      error: 'No se pudo actualizar el nombre. Intenta nuevamente.',
    }
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'No autorizado. Solo administradores pueden eliminar usuarios.',
      }
    }

    if (userId === session.user.id) {
      return {
        success: false,
        error: 'No puedes eliminar tu propia cuenta desde aquí.',
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })

    if (!existingUser) {
      return {
        success: false,
        error: 'Usuario no encontrado.',
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath('/admin/usuarios')
    revalidatePath('/admin')

    return { success: true }
  } catch {
    return {
      success: false,
      error: 'No se pudo eliminar el usuario. Intenta nuevamente.',
    }
  }
}
