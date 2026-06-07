'use server'

import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/action-response'

export async function incrementVenueViewAction(venueId: string): Promise<ActionResponse<void>> {
  try {
    await prisma.venue.update({
      where: { id: venueId },
      data: { viewCount: { increment: 1 } },
    })
    return { success: true }
  } catch {
    return { success: false, error: 'Error al registrar vista.' }
  }
}

export async function incrementEventViewAction(eventId: string): Promise<ActionResponse<void>> {
  try {
    await prisma.event.update({
      where: { id: eventId },
      data: { viewCount: { increment: 1 } },
    })
    return { success: true }
  } catch {
    return { success: false, error: 'Error al registrar vista.' }
  }
}
