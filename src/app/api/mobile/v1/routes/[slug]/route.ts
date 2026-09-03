import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { mapRouteDetail, routeDetailSelect } from '@/lib/mobile-routes'
import { prisma } from '@/lib/prisma'

/**
 * Public itinerary detail. Stops arrive grouped by day so the app can render a
 * day picker without regrouping, and the flat `stops` array is kept for the map
 * overlay, which draws one polyline across the selected day.
 */
export const GET = withMobileErrors(
  async (_request: Request, context: { params: Promise<{ slug: string }> }) => {
    const { slug } = await context.params

    const route = await prisma.route.findFirst({
      where: { slug, status: 'APPROVED' },
      select: routeDetailSelect,
    })

    if (!route) return mobileError('NOT_FOUND', 'La ruta no está disponible.', 404)

    // `routeDetailSelect` is a validator, so the row is the shape the mapper
    // expects even though Prisma widens the inferred type here.
    return mobileSuccess(mapRouteDetail(route as Parameters<typeof mapRouteDetail>[0]))
  },
)
