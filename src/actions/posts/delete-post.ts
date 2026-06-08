'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidatePostCache } from '@/lib/cache-invalidation'
import type { ActionResponse } from '@/types/action-response'

export async function deletePostAction(postId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'No autorizado. Solo administradores pueden eliminar artículos.',
      }
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    })

    if (!existingPost) {
      return {
        success: false,
        error: 'Artículo no encontrado.',
      }
    }

    await prisma.post.delete({
      where: { id: postId },
    })

    revalidatePath('/blog')
    revalidatePath('/admin')
    revalidatePath('/admin/blog')
    revalidatePath('/dashboard')
    await invalidatePostCache(postId)

    return { success: true }
  } catch {
    return {
      success: false,
      error: 'No se pudo eliminar el artículo. Intenta nuevamente.',
    }
  }
}
