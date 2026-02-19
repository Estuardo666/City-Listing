'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { postStatusUpdateSchema } from '@/schemas/post.schema'
import type { ActionResponse } from '@/types/action-response'
import type { PostWithRelations } from '@/types/post'

export async function updatePostStatusAction(
  input: unknown
): Promise<ActionResponse<PostWithRelations>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado. Solo administradores pueden cambiar el estado.' }
    }

    const parsed = postStatusUpdateSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
    }

    const prismaAny = prisma as unknown as {
      post: {
        update: (args: unknown) => Promise<PostWithRelations>
      }
    }

    const updated = await prismaAny.post.update({
      where: { id: parsed.data.postId },
      data: {
        status: parsed.data.status,
        publishedAt: parsed.data.status === 'APPROVED' ? new Date() : undefined,
      },
      include: {
        category: true,
        user: { select: { id: true, name: true, email: true } },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    revalidatePath('/blog')
    revalidatePath(`/blog/${updated.slug}`)
    revalidatePath('/admin/blog')
    revalidatePath('/dashboard')

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar el estado del artículo.' }
  }
}
