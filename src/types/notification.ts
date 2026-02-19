import type { Prisma } from '@prisma/client'

export type NotificationPreferenceRow = Prisma.NotificationPreferenceGetPayload<{
  select: {
    enabled: true
    hoursAhead: true
  }
}>
