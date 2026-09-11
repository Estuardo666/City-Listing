import 'server-only'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

function periodStart(bucket: 'DAILY' | 'MONTHLY') {
  const now = new Date()
  return bucket === 'DAILY'
    ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

async function recordUsage(endpoint: string, outcome: 'request' | 'success' | 'error' | 'quota', venueId?: string) {
  const increments = { requests: 0, successes: 0, errors: 0, quotaErrors: 0 }
  if (outcome === 'request') increments.requests = 1
  if (outcome === 'success') increments.successes = 1
  if (outcome === 'error') increments.errors = 1
  if (outcome === 'quota') { increments.errors = 1; increments.quotaErrors = 1 }
  for (const bucket of ['DAILY', 'MONTHLY'] as const) {
    await prisma.googlePlaceUsage.upsert({
      where: { bucket_periodStart_endpoint_venueKey: { bucket, periodStart: periodStart(bucket), endpoint, venueKey: venueId ?? 'global' } },
      create: { bucket, periodStart: periodStart(bucket), endpoint, venueKey: venueId ?? 'global', venueId, ...increments },
      update: { requests: { increment: increments.requests }, successes: { increment: increments.successes }, errors: { increment: increments.errors }, quotaErrors: { increment: increments.quotaErrors } },
    })
  }
}

async function trackedFetch(url: string, init: RequestInit, endpoint: string, venueId?: string) {
  await recordUsage(endpoint, 'request', venueId).catch(() => {})
  try {
    const response = await fetch(url, init)
    if (response.ok) await recordUsage(endpoint, 'success', venueId).catch(() => {})
    else await recordUsage(endpoint, response.status === 429 ? 'quota' : 'error', venueId).catch(() => {})
    return response
  } catch (error) {
    await recordUsage(endpoint, 'error', venueId).catch(() => {})
    throw error
  }
}

const httpsUrl = z.string().url().refine((value) => value.startsWith('https://'))
const photoSchema = z.object({
  name: z.string(),
  googleMapsUri: httpsUrl.optional(),
  authorAttributions: z.array(z.object({
    displayName: z.string(),
    uri: httpsUrl.optional(),
    photoUri: httpsUrl.optional(),
  })).default([]),
})

export async function getGooglePlacePhoto(placeId: string, width: 400 | 1200, venueId?: string) {
  const setting = await prisma.billingSetting.findUnique({ where: { id: 'global' }, select: { googlePhotoEnabled: true } }).catch(() => null)
  if (setting?.googlePhotoEnabled === false) return null
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return null
  const response = await trackedFetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'photos' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  }, 'place-details', venueId)
  if (!response.ok) throw new Error('Google photo details unavailable')
  const details = z.object({ photos: z.array(photoSchema).default([]) }).parse(await response.json())
  // Require source attribution, and only follow resource names for this place.
  const photo = details.photos.find((entry) => entry.googleMapsUri
    && entry.name.startsWith(`places/${placeId}/photos/`)
    && /^places\/[^/]+\/photos\/[^/]+$/.test(entry.name))
  if (!photo) return null

  const media = await trackedFetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${width}&skipHttpRedirect=true`, {
    headers: { 'X-Goog-Api-Key': key },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  }, 'place-photo-media', venueId)
  if (!media.ok) throw new Error('Google photo unavailable')
  const { photoUri } = z.object({ photoUri: httpsUrl }).parse(await media.json())
  return { photoUri, googleMapsUri: photo.googleMapsUri!, authors: photo.authorAttributions }
}
