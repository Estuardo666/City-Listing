'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function saveInterestsAction(categoryIds: string[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autenticado')

  const userId = session.user.id

  await prisma.userInterest.deleteMany({ where: { userId } })

  if (categoryIds.length > 0) {
    await prisma.userInterest.createMany({
      data: categoryIds.map((categoryId) => ({ userId, categoryId })),
    })
  }

  return { success: true }
}
