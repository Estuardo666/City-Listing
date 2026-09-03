import type { Prisma } from '@prisma/client'

export const NOTIFICATION_PREFERENCE_SELECT = {
  enabled: true,
  hoursAhead: true,
  pushEnabled: true,
  emailEnabled: true,
  eventReminders: true,
  newFollowedVenuePost: true,
  reviewReply: true,
  claimUpdates: true,
  messageReceived: true,
  moderationUpdates: true,
} as const

export type NotificationPreferenceRow = Prisma.NotificationPreferenceGetPayload<{
  select: typeof NOTIFICATION_PREFERENCE_SELECT
}>
