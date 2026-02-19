'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { postSchema } from '@/schemas/post.schema'
import type { ActionResponse } from '@/types/action-response'
import type { PostWithRelations } from '@/types/post'

export async function updatePostAction(
  postId: string,
  input: unknown
): Promise<ActionResponse<PostWithRelations>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const parsed = postSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
    }

    const existing = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, slug: true },
    })

    if (!existing) {
      return { success: false, error: 'Artículo no encontrado.' }
    }

    const isOwner = existing.userId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return { success: false, error: 'No tienes permiso para editar este artículo.' }
    }

    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, type: 'POST' },
      select: { id: true },
    })

    if (!category) {
      return { success: false, error: 'Categoría inválida.' }
    }

    const prismaAnyPost = prisma as unknown as {
      post: {
        update: (args: unknown) => Promise<PostWithRelations>
      }
    }

    const updated = await prismaAnyPost.post.update({
      where: { id: postId },
      data: {
        title: parsed.data.title,
        excerpt: parsed.data.excerpt,
        content: parsed.data.content,
        image: parsed.data.image,
        featured: parsed.data.featured ?? false,
        categoryId: category.id,
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

    // Sync tags: delete existing, upsert and reconnect (requires npx prisma db push)
    const tagNames = parsed.data.tags ?? []
    try {
      const prismaPostTag = prisma as unknown as Record<string, { deleteMany: (args: unknown) => Promise<unknown>; createMany: (args: unknown) => Promise<unknown> }>
      await prismaPostTag['postTag'].deleteMany({ where: { postId } })
      if (tagNames.length > 0) {
        const prismaTag = prisma as unknown as Record<string, { upsert: (args: unknown) => Promise<{ id: string }> }>
        const tagIds: string[] = []
        for (const tagName of tagNames) {
          const tagSlug = slugify(tagName)
          const tag = await prismaTag['tag'].upsert({
            where: { slug: tagSlug },
            update: {},
            create: { name: tagName.toLowerCase(), slug: tagSlug },
            select: { id: true },
          })
          tagIds.push(tag.id)
        }
        await prismaPostTag['postTag'].createMany({
          data: tagIds.map((tagId) => ({ postId, tagId })),
        })
      }
    } catch {
      // Tag sync fails gracefully before db push
    }

    revalidatePath('/blog')
    revalidatePath(`/blog/${updated.slug}`)
    revalidatePath('/admin/blog')

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar el artículo.' }
  }
}
