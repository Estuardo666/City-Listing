import { getWatchEventBySlug } from '@/lib/queries/watch-events'
import { mapWatchEvent } from '@/lib/mobile-watch-events'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const event = await getWatchEventBySlug(slug)
  if (!event) return mobileError('NOT_FOUND', 'Transmisión no encontrada.', 404)

  return mobileSuccess({
    ...mapWatchEvent(event),
    venues: event.venues.map(({ id, flyerUrl, promotion, hasBigScreen, hasFreeEntry, venue }) => ({
      id,
      flyerUrl,
      promotion,
      hasBigScreen,
      hasFreeEntry,
      venue,
    })),
  })
}
