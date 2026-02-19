'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { postSchema } from '@/schemas/post.schema'
import type { ActionResponse } from '@/types/action-response'
import type { PostWithRelations } from '@/types/post'

async function generateUniquePostSlug(baseName: string): Promise<string> {
  const baseSlug = slugify(baseName)
  let candidateSlug = baseSlug
  let suffix = 1

  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    })
    if (!existing) return candidateSlug
    suffix += 1
    candidateSlug = `${baseSlug}-${suffix}`
  }
}

export async function createPostAction(input: unknown): Promise<ActionResponse<PostWithRelations>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado. Inicia sesión para publicar artículos.' }
    }

    const parsed = postSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
    }

    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, type: 'POST' },
      select: { id: true },
    })

    if (!category) {
      return { success: false, error: 'La categoría seleccionada no es válida para artículos.' }
    }

    const slug = await generateUniquePostSlug(parsed.data.title)

    const prismaAnyPost = prisma as unknown as {
      post: {
        create: (args: unknown) => Promise<PostWithRelations>
      }
    }

    const created = await prismaAnyPost.post.create({
      data: {
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt,
        content: parsed.data.content,
        image: parsed.data.image,
        featured: parsed.data.featured ?? false,
        status: 'PENDING',
        categoryId: category.id,
        userId: session.user.id,
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

    // Upsert and connect tags after post creation (requires npx prisma db push)
    const tagNames = parsed.data.tags ?? []
    if (tagNames.length > 0) {
      const prismaAny = prisma as unknown as Record<string, { upsert: (args: unknown) => Promise<{ id: string }> }>
      const tagIds: string[] = []
      for (const tagName of tagNames) {
        const tagSlug = slugify(tagName)
        const tag = await prismaAny['tag'].upsert({
          where: { slug: tagSlug },
          update: {},
          create: { name: tagName.toLowerCase(), slug: tagSlug },
          select: { id: true },
        })
        tagIds.push(tag.id)
      }
      const prismaPostTag = prisma as unknown as Record<string, { createMany: (args: unknown) => Promise<unknown> }>
      await prismaPostTag['postTag'].createMany({
        data: tagIds.map((tagId) => ({ postId: created.id, tagId })),
      })
    }

    revalidatePath('/blog')
    revalidatePath('/dashboard')

    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo crear el artículo. Intenta nuevamente.' }
  }
}
