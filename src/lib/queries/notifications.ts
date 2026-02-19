import { prisma } from '@/lib/prisma'
import type { NotificationPreferenceRow } from '@/types/notification'
import type { UpcomingEventNotification } from '@/types/event'

export async function getNotificationPreferencesByUserId(
  userId: string
): Promise<NotificationPreferenceRow | null> {
  return prisma.notificationPreference.findUnique({
    where: { userId },
    select: {
      enabled: true,
      hoursAhead: true,
    },
  })
}

export async function getUpcomingEventNotificationsForUser(
  userId: string,
  input: { hoursAhead: number; limit: number }
): Promise<UpcomingEventNotification[]> {
  const now = new Date()
  const upperBound = new Date(now.getTime() + input.hoursAhead * 60 * 60 * 1000)

  return prisma.event.findMany({
    where: {
      status: 'APPROVED',
      startDate: {
        gte: now,
        lte: upperBound,
      },
      eventNotifications: {
        none: {
          userId,
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
    take: input.limit,
    select: {
      id: true,
      title: true,
      slug: true,
      startDate: true,
      location: true,
      address: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  })
}
