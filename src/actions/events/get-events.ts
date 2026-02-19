'use server'

import { eventListFiltersSchema } from '@/schemas/event.schema'
import { getEvents } from '@/lib/queries/events'
import type { ActionResponse } from '@/types/action-response'
import type { EventListItem } from '@/types/event'

export async function getEventsAction(
  filters: unknown
): Promise<ActionResponse<EventListItem[]>> {
  try {
    const parsedFilters = eventListFiltersSchema.parse(filters ?? {})
    const events = await getEvents(parsedFilters)

    return {
      success: true,
      data: events,
    }
  } catch {
    return {
      success: false,
      error: 'No se pudieron cargar los eventos.',
    }
  }
}
