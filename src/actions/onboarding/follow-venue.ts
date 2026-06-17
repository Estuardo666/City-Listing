'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function followVenueAction(venueId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autenticado')

  const userId = session.user.id

  await prisma.userFollowingVenue.upsert({
    where: { userId_venueId: { userId, venueId } },
    create: { userId, venueId },
    update: {},
  })

  return { success: true }
}

export async function unfollowVenueAction(venueId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autenticado')

  const userId = session.user.id

  await prisma.userFollowingVenue.deleteMany({
    where: { userId, venueId },
  })

  return { success: true }
}
