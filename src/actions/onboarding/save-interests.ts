'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function saveInterestsAction(categoryIds: string[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autenticado')

  const userId = session.user.id

  const uniqueCategoryIds = [...new Set(categoryIds)].slice(0, 30)
  const validCategories = await prisma.category.findMany({
    where: { id: { in: uniqueCategoryIds }, type: 'VENUE' },
    select: { id: true },
  })

  if (validCategories.length !== uniqueCategoryIds.length) {
    return { success: false, error: 'Una categoría ya no está disponible.' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.userInterest.deleteMany({ where: { userId } })
    if (uniqueCategoryIds.length > 0) {
      await tx.userInterest.createMany({ data: uniqueCategoryIds.map((categoryId) => ({ userId, categoryId })) })
    }
  })

  revalidatePath('/')
  revalidatePath('/dashboard/intereses')

  return { success: true }
}
