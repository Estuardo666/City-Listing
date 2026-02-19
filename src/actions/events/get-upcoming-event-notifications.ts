'use server'

import { getUpcomingEventNotifications } from '@/lib/queries/events'
import {
  upcomingEventNotificationInputSchema,
  type UpcomingEventNotificationInput,
} from '@/schemas/event.schema'
import type { ActionResponse } from '@/types/action-response'
import type { UpcomingEventNotification } from '@/types/event'

export async function getUpcomingEventNotificationsAction(
  input: unknown = {}
): Promise<ActionResponse<UpcomingEventNotification[]>> {
  try {
    const parsed = upcomingEventNotificationInputSchema.parse(input ?? {})
    const notifications = await getUpcomingEventNotifications(parsed)

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

export type { UpcomingEventNotificationInput }
