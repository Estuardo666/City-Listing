/**
 * Google Maps Platform terms (§3.2.3) cap how long Places content may be
 * stored: the place ID can be kept indefinitely, everything else — name,
 * address, phone, website, rating, review count, opening hours — expires after
 * 30 days. Photo bytes may never be stored at all (see `place-photo.ts`, which
 * fetches them on demand).
 *
 * These constants are the single source of truth for that window. Sync picks
 * rows up at `GOOGLE_REFRESH_AFTER_DAYS` so there is slack before the hard
 * limit; readers hide anything past `GOOGLE_DATA_MAX_AGE_DAYS` in case sync is
 * down.
 */
export const GOOGLE_DATA_MAX_AGE_DAYS = 30
export const GOOGLE_REFRESH_AFTER_DAYS = 25

const DAY_MS = 24 * 60 * 60 * 1000

/** Cutoff for sync: rows last synced before this are due for a refresh. */
export function googleRefreshCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - GOOGLE_REFRESH_AFTER_DAYS * DAY_MS)
}

/**
 * True when cached Google content is past the 30-day limit and must not be
 * displayed. A missing timestamp counts as stale: it means the row was written
 * before sync started stamping it, so its age is unknown.
 */
export function isGoogleDataStale(googleLastSyncAt: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!googleLastSyncAt) return true
  const syncedAt = googleLastSyncAt instanceof Date ? googleLastSyncAt : new Date(googleLastSyncAt)
  if (Number.isNaN(syncedAt.getTime())) return true
  return now.getTime() - syncedAt.getTime() > GOOGLE_DATA_MAX_AGE_DAYS * DAY_MS
}

/** Canonical Google Maps link for a place, required as attribution when showing its content. */
export function googlePlaceUrl(googlePlaceId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(googlePlaceId)}`
}
