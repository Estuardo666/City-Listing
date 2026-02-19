'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getNotificationPreferencesByUserId, getUpcomingEventNotificationsForUser } from '@/lib/queries/notifications'
import type { ActionResponse } from '@/types/action-response'
import type { UpcomingEventNotification } from '@/types/event'

export async function pullUpcomingEventNotificationsAction(
  input: unknown = {}
): Promise<ActionResponse<UpcomingEventNotification[]>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado.',
      }
    }

    const userId = session.user.id

    const prefs = await getNotificationPreferencesByUserId(userId)

    const enabled = prefs?.enabled ?? true
    const hoursAhead = prefs?.hoursAhead ?? 48

    if (!enabled) {
      return {
        success: true,
        data: [],
      }
    }

    const limit = typeof (input as { limit?: unknown }).limit === 'number' ? (input as { limit: number }).limit : 6

    const notifications = await getUpcomingEventNotificationsForUser(userId, {
      hoursAhead,
      limit,
    })

    if (notifications.length > 0) {
      const eventIds = notifications.map((event) => event.id)
      const prismaAny = prisma as unknown as {
        eventNotification: {
          findMany: (args: unknown) => Promise<Array<{ eventId: string }>>
          createMany: (args: unknown) => Promise<unknown>
        }
      }

      const existing = await prismaAny.eventNotification.findMany({
        where: {
          userId,
          eventId: {
            in: eventIds,
          },
        },
        select: {
          eventId: true,
        },
      })

      const existingIds = new Set(existing.map((item: { eventId: string }) => item.eventId))
      const toCreate = notifications.filter((event) => !existingIds.has(event.id))

      if (toCreate.length > 0) {
      await prismaAny.eventNotification.createMany({
        data: toCreate.map((event) => ({
          userId,
          eventId: event.id,
        })),
      })
      }
    }

    return {
      success: true,
      data: notifications,
    }
  } catch {
    return {
      success: false,
      error: 'No se pudieron cargar las notificaciones de eventos próximos.',
    }
  }
}
