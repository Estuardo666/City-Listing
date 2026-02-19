import { z } from 'zod'

export const notificationPreferencesSchema = z.object({
  enabled: z.coerce.boolean().optional().default(true),
  hoursAhead: z.coerce.number().int().min(1).max(168).optional().default(48),
})

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>
