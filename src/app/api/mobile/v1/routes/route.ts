import { z } from 'zod'

import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { routeSelect } from '@/lib/mobile-routes'
import { prisma } from '@/lib/prisma'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

const querySchema = z.object({
  type: z.string().trim().max(40).optional(),
  difficulty: z.string().trim().max(40).optional(),
  days: z.coerce.number().int().min(1).max(14).optional(),
  featured: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
  /** Opaque cursor: the id of the last route of the previous page. */
  cursor: z.string().trim().max(64).optional(),
})

export const GET = withMobileErrors(async (request: Request) => {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))
  if (!parsed.success) {
    return mobileError(
      'VALIDATION_ERROR',
      'Los filtros de rutas no son válidos.',
      422,
      parsed.error.flatten().fieldErrors,
    )
  }

  const limit = parsed.data.limit ?? DEFAULT_LIMIT

  const routes = await prisma.route.findMany({
    where: {
      status: 'APPROVED',
      ...(parsed.data.type ? { type: parsed.data.type } : {}),
      ...(parsed.data.difficulty ? { difficulty: parsed.data.difficulty } : {}),
      ...(parsed.data.days ? { days: parsed.data.days } : {}),
      ...(parsed.data.featured ? { featured: parsed.data.featured === 'true' } : {}),
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    // Cursor pagination: one extra row tells us whether another page exists
    // without a second count query.
    take: limit + 1,
    ...(parsed.data.cursor ? { cursor: { id: parsed.data.cursor }, skip: 1 } : {}),
    select: {
      ...routeSelect,
      user: { select: { id: true, name: true } },
      _count: { select: { stops: true, favorites: true } },
    },
  })

  const page = routes.slice(0, limit)
  const hasMore = routes.length > limit

  return mobileSuccess(
    page.map((route) => ({
      ...route,
      stopCount: route._count.stops,
      favoriteCount: route._count.favorites,
    })),
    { hasMore, nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null },
  )
})
