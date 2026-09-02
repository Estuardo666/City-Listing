import { getActiveWatchEvents } from '@/lib/queries/watch-events'
import { mapWatchEvent } from '@/lib/mobile-watch-events'
import { mobileSuccess } from '@/lib/mobile-response'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawLimit = Number(searchParams.get('limit') ?? '50')
  const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, Math.floor(rawLimit))) : 50
  const events = await getActiveWatchEvents(limit)
  return mobileSuccess(events.map((event) => ({ ...mapWatchEvent(event), venueCount: event._count.venues })))
}
