import { googleHoursSync } from '@/lib/google/google-hours-sync'
import { GOOGLE_DATA_MAX_AGE_DAYS, GOOGLE_REFRESH_AFTER_DAYS } from '@/lib/google/freshness'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Batch size per run. Each venue costs one Place Details call plus a 2s pause
 * between batches, so this has to fit inside `maxDuration`.
 */
const MAX_PER_RUN = 60

/**
 * Refreshes Google Places content before it ages out. Scheduled from `vercel.json`.
 *
 * Google's terms let us keep the place ID forever but cap every other Places
 * field at 30 days, so cached rows have to be re-read or dropped. Sync picks
 * rows up at 25 days, leaving five days of slack for failed runs; anything that
 * still slips past 30 is hidden at read time by `isGoogleDataStale`.
 *
 * Oldest rows go first (`getVenuesForSync` orders by `googleLastSyncAt`), so a
 * backlog drains in the order it would expire.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json({ error: 'CRON_SECRET no configurado' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const result = await googleHoursSync.run(MAX_PER_RUN, 20, undefined, undefined, true)

  return Response.json({
    ...result,
    refreshAfterDays: GOOGLE_REFRESH_AFTER_DAYS,
    maxAgeDays: GOOGLE_DATA_MAX_AGE_DAYS,
  })
}
