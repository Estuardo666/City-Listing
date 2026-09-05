/**
 * Per-tab cache for Google Place photos.
 *
 * Client-only by design: the Map lives in the browser bundle, so it is scoped
 * to one tab, never touches disk, and dies on reload or tab close. Never import
 * this from a server component — a module-level Map on the server would be
 * shared across every visitor.
 *
 * Google's terms forbid storing photo content, and the `photoUri` Google
 * returns is a short-lived signed URL that breaks well before any storage limit
 * would matter. `TTL_MS` is set far below that lifetime: the point is to
 * collapse repeat views within a single browsing session (list → detail → back
 * → detail), not to keep anything around.
 */

export type GooglePhoto = {
  photoUri: string
  googleMapsUri: string
  authors: Array<{ displayName: string; uri?: string; photoUri?: string }>
}

export type GooglePhotoSize = 'small' | 'large'

/** Well under the signed URL's lifetime, so a cache hit is never a broken image. */
const TTL_MS = 5 * 60 * 1000

/** Bounds a long single-page session; entries are cheap but not free. */
const MAX_ENTRIES = 100

type Entry = { photo: GooglePhoto | null; expiresAt: number }

const cache = new Map<string, Entry>()
/** Requests already in flight, so two components mounting at once fetch once. */
const inflight = new Map<string, Promise<GooglePhoto | null>>()

function cacheKey(slug: string, size: GooglePhotoSize) {
  return `${slug}:${size}`
}

function prune(now: number) {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key)
  }
  // Map iterates in insertion order, so the front of it is the oldest.
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next()
    if (oldest.done) break
    cache.delete(oldest.value)
  }
}

/**
 * Resolves the venue's Google photo, reusing a fresh result from this tab.
 *
 * Takes no AbortSignal on purpose: the fetch is shared between callers, so one
 * component unmounting must not cancel it for the others. Callers check their
 * own signal before acting on the result.
 *
 * A venue with no photo caches as `null` — that answer is worth remembering too.
 * Failures cache nothing, so the next viewport hit retries.
 */
export async function getGooglePhoto(slug: string, size: GooglePhotoSize): Promise<GooglePhoto | null> {
  const key = cacheKey(slug, size)
  const now = Date.now()

  const hit = cache.get(key)
  if (hit && hit.expiresAt > now) return hit.photo

  const pending = inflight.get(key)
  if (pending) return pending

  const request = (async () => {
    const response = await fetch(
      `/api/venues/${encodeURIComponent(slug)}/google-photo?size=${size}`,
      { cache: 'no-store' }
    )
    if (!response.ok) throw new Error('Google photo unavailable')
    const data = await response.json()
    const photo: GooglePhoto | null = data.photo ?? null
    cache.set(key, { photo, expiresAt: Date.now() + TTL_MS })
    prune(Date.now())
    return photo
  })()

  inflight.set(key, request)
  try {
    return await request
  } finally {
    inflight.delete(key)
  }
}

/** Drops a cached entry after the browser fails to load its URL. */
export function invalidateGooglePhoto(slug: string, size: GooglePhotoSize) {
  cache.delete(cacheKey(slug, size))
}
