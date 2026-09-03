import { z } from 'zod'

/**
 * Mirrors the `NotificationPreference` columns the user controls. Kept in sync
 * with `NOTIFICATION_TYPES` in `lib/notifications/types` — the mobile API
 * validates the same field names, so both surfaces edit one row.
 */
export const notificationPreferencesSchema = z.object({
  enabled: z.coerce.boolean().optional().default(true),
  hoursAhead: z.coerce.number().int().min(1).max(168).optional().default(48),

  // Channels
  pushEnabled: z.coerce.boolean().optional().default(true),
  emailEnabled: z.coerce.boolean().optional().default(true),

  // Types
  eventReminders: z.coerce.boolean().optional().default(true),
  newFollowedVenuePost: z.coerce.boolean().optional().default(true),
  reviewReply: z.coerce.boolean().optional().default(true),
  claimUpdates: z.coerce.boolean().optional().default(true),
  messageReceived: z.coerce.boolean().optional().default(true),
  moderationUpdates: z.coerce.boolean().optional().default(true),
})

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>
