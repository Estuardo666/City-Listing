'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const updateCategorySchema = z.object({
  categoryId: z.string(),
  seoTitle: z.string().max(70).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
  introText: z.string().max(500).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(10).optional().nullable(),
  color: z.string().max(7).optional().nullable(),
})

type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

export async function updateCategoryAction(input: UpdateCategoryInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado' }
    }

    const parsed = updateCategorySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Datos invalidos' }
    }

    const { categoryId, ...data } = parsed.data

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return { success: false, error: 'Categoria no encontrada' }
    }

    await prisma.category.update({
      where: { id: categoryId },
      data: {
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        introText: data.introText ?? null,
        description: data.description ?? null,
        icon: data.icon ?? null,
        color: data.color ?? null,
      },
    })

    revalidatePath(`/${category.slug}`)
    revalidatePath(`/mejores/${category.slug}`)
    revalidatePath('/sitemap.xml')
    revalidatePath('/admin/categorias')

    return { success: true }
  } catch (error) {
    console.error('Error updating category:', error)
    return { success: false, error: 'Error al actualizar la categoria' }
  }
}
