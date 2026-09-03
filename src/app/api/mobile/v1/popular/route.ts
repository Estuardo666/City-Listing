import { z } from 'zod'

import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'
import { getPopularNow } from '@/lib/views'

const querySchema = z.object({
  kind: z.enum(['venue', 'event']).default('venue'),
  window: z.enum(['24h', '7d']).default('24h'),
  limit: z.coerce.number().int().min(1).max(20).default(10),
})

/**
 * What people are actually opening right now, across the app, the site and the
 * installed PWA — as opposed to the lifetime `viewCount`, which only ever
 * rewards old content.
 */
export const GET = withMobileErrors(async (request: Request) => {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))
  if (!parsed.success) {
    return mobileError('VALIDATION_ERROR', 'Los filtros no son válidos.', 422)
  }

  const ranked = await getPopularNow(parsed.data)
  if (ranked.length === 0) return mobileSuccess([], { window: parsed.data.window })

  const ids = ranked.map((row) => row.itemId)
  const viewsById = new Map(ranked.map((row) => [row.itemId, row.views]))

  const items =
    parsed.data.kind === 'venue'
      ? await prisma.venue.findMany({
          where: { id: { in: ids }, status: 'APPROVED', isActive: true },
          select: {
            id: true, name: true, slug: true, description: true, image: true,
            location: true, address: true, lat: true, lng: true, featured: true,
            phone: true, website: true, priceRange: true, avgRating: true,
            reviewCount: true, verified: true,
          },
        })
      : await prisma.event.findMany({
          where: { id: { in: ids }, status: 'APPROVED' },
          select: {
            id: true, title: true, slug: true, description: true, image: true,
            startDate: true, endDate: true, location: true, address: true,
            lat: true, lng: true, featured: true, price: true, avgRating: true,
            reviewCount: true,
          },
        })

  // The ranking comes from the view table, so the database's own ordering is
  // irrelevant; rows that no longer qualify simply drop out.
  const ordered = items
    .map((item) => ({ ...item, recentViews: viewsById.get(item.id) ?? 0 }))
    .sort((a, b) => b.recentViews - a.recentViews)

  return mobileSuccess(ordered, { window: parsed.data.window, kind: parsed.data.kind })
})
