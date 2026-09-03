'use server'

import { headers } from 'next/headers'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { anonymousViewerId, recordView, type ViewKind } from '@/lib/views'
import type { ActionResponse } from '@/types/action-response'

/**
 * Web views go through the same recorder the mobile endpoint uses, so a venue
 * opened on the site, in the installed PWA and in the app all feed one
 * "popular now" ranking. Previously the site incremented the lifetime counter
 * directly, with no dedupe and no timestamp.
 */
async function record(kind: ViewKind, itemId: string): Promise<ActionResponse<void>> {
  try {
    const [session, headerList] = await Promise.all([getServerSession(authOptions), headers()])

    // Server Actions have no Request object; the incoming headers carry the
    // same fields the viewer id is derived from.
    const request = new Request('https://viveloja.com', { headers: headerList })

    const result = await recordView({
      kind,
      itemId,
      userId: session?.user?.id ?? null,
      viewerId: anonymousViewerId(request),
      source: 'web',
    })

    if (!result.found) return { success: false, error: 'Contenido no disponible.' }
    return { success: true }
  } catch {
    return { success: false, error: 'Error al registrar vista.' }
  }
}

export async function incrementVenueViewAction(venueId: string): Promise<ActionResponse<void>> {
  return record('venue', venueId)
}

export async function incrementEventViewAction(eventId: string): Promise<ActionResponse<void>> {
  return record('event', eventId)
}

export async function incrementRouteViewAction(routeId: string): Promise<ActionResponse<void>> {
  return record('route', routeId)
}

export async function incrementCollectionViewAction(
  collectionId: string,
): Promise<ActionResponse<void>> {
  return record('collection', collectionId)
}
