'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/action-response'

export async function blockUserAction(
  venueId: string,
  userId: string,
  reason?: string
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { userId: true },
    })

    if (!venue || venue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño de este local.' }
    }

    if (userId === session.user.id) {
      return { success: false, error: 'No puedes bloquearte a ti mismo.' }
    }

    const existingBlock = await prisma.blockedUser.findFirst({
      where: {
        venueId,
        blockedUserId: userId,
      },
    })

    if (existingBlock) {
      return { success: false, error: 'Este usuario ya está bloqueado.' }
    }

    await prisma.blockedUser.create({
      data: {
        venueId,
        blockedUserId: userId,
        blockedBy: session.user.id,
        reason: reason?.trim() || null,
      },
    })

    revalidatePath(`/dashboard/locales/${venueId}/mensajes`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo bloquear al usuario.' }
  }
}

export async function unblockUserAction(
  venueId: string,
  userId: string
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { userId: true },
    })

    if (!venue || venue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño de este local.' }
    }

    await prisma.blockedUser.deleteMany({
      where: {
        venueId,
        blockedUserId: userId,
      },
    })

    revalidatePath(`/dashboard/locales/${venueId}/mensajes`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo desbloquear al usuario.' }
  }
}

export async function getBlockedUsersAction(venueId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return []
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { userId: true },
    })

    if (!venue || venue.userId !== session.user.id) {
      return []
    }

    const blockedUsers = await prisma.blockedUser.findMany({
      where: { venueId },
      include: {
        blockedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return blockedUsers
  } catch {
    return []
  }
}

export async function isUserBlockedAction(venueId: string, userId: string): Promise<boolean> {
  try {
    const blocked = await prisma.blockedUser.findFirst({
      where: {
        venueId,
        blockedUserId: userId,
      },
    })

    return !!blocked
  } catch {
    return false
  }
}
