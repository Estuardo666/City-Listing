import 'server-only'
import { z } from 'zod'

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

export async function getGooglePlacePhoto(placeId: string, width: 400 | 1200) {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return null
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'photos' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error('Google photo details unavailable')
  const details = z.object({ photos: z.array(photoSchema).default([]) }).parse(await response.json())
  // Require source attribution, and only follow resource names for this place.
  const photo = details.photos.find((entry) => entry.googleMapsUri
    && entry.name.startsWith(`places/${placeId}/photos/`)
    && /^places\/[^/]+\/photos\/[^/]+$/.test(entry.name))
  if (!photo) return null

  const media = await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${width}&skipHttpRedirect=true`, {
    headers: { 'X-Goog-Api-Key': key },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (!media.ok) throw new Error('Google photo unavailable')
  const { photoUri } = z.object({ photoUri: httpsUrl }).parse(await media.json())
  return { photoUri, googleMapsUri: photo.googleMapsUri!, authors: photo.authorAttributions }
}
