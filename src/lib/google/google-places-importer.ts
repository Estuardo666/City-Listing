import { prisma } from '@/lib/prisma'
import { googlePlacesService } from '@/lib/google-places'
import type { GooglePlaceNormalized, DuplicateCheckResult } from '@/types/google-import'
import { GOOGLE_CATEGORIES } from '@/types/google-import'

function normalizeString(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function buildSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 80)
}

class GooglePlacesImporter {
  async searchPlaces(
    query: string,
    location: { lat: number; lng: number },
    radius: number,
    categoryKeys?: string[],
    maxResults: number = 20
  ): Promise<any[]> {
    const typesToSearch = categoryKeys && categoryKeys.length > 0
      ? categoryKeys
      : ['restaurant']

    const seenIds = new Set<string>()
    const allResults: any[] = []

    for (const key of typesToSearch) {
      const cat = GOOGLE_CATEGORIES[key]
      if (!cat) continue

      const typeQuery = `${cat.label} en ${query}`

      try {
        const results = await googlePlacesService.searchPlaces(typeQuery, {
          location,
          radius,
          maxResultCount: Math.min(maxResults, 20),
        })

        for (const place of results) {
          if (place.id && !seenIds.has(place.id)) {
            seenIds.add(place.id)
            allResults.push(place)
          }
        }
      } catch (error) {
        console.error(`Error searching for ${key}:`, error)
      }
    }

    return allResults.slice(0, maxResults)
  }

  async getPlaceDetails(placeId: string): Promise<GooglePlaceNormalized | null> {
    try {
      const details = await googlePlacesService.getPlaceDetails(placeId)
      return this.normalizePlace(details)
    } catch (error) {
      console.error('Error fetching place details:', error)
      return null
    }
  }

  normalizePlace(place: any): GooglePlaceNormalized {
    return {
      google_place_id: place.id || place.placeId || '',
      name: place.displayName?.text || '',
      category: place.primaryTypeDisplayName?.text || place.primaryType || '',
      address: place.formattedAddress || '',
      phone: place.nationalPhoneNumber || place.phoneNumber || null,
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
    }
  }

  normalizePlaces(places: any[]): GooglePlaceNormalized[] {
    return places.map((p) => this.normalizePlace(p))
  }

  async detectDuplicate(place: GooglePlaceNormalized): Promise<DuplicateCheckResult> {
    if (place.google_place_id) {
      const byPlaceId = await prisma.venue.findFirst({
        where: { googlePlaceId: place.google_place_id } as any,
        select: { id: true, name: true, slug: true, googlePlaceId: true },
      })
      if (byPlaceId) {
        return {
          isDuplicate: true,
          existingVenue: { ...byPlaceId, googlePlaceId: byPlaceId.googlePlaceId as string | null },
          similarity: 100,
          matchType: 'google_place_id',
        }
      }
    }

    if (place.phone) {
      const normalizedPhone = place.phone.replace(/[^0-9+]/g, '')
      if (normalizedPhone.length >= 7) {
        const byPhone = await prisma.venue.findFirst({
          where: { phone: normalizedPhone },
          select: { id: true, name: true, slug: true, googlePlaceId: true },
        })
        if (byPhone) {
          return {
            isDuplicate: true,
            existingVenue: { ...byPhone, googlePlaceId: byPhone.googlePlaceId as string | null },
            similarity: 70,
            matchType: 'phone',
          }
        }
      }
    }

    const nearbyVenues = await prisma.$queryRaw<
      Array<{
        id: string
        name: string
        slug: string
        lat: number
        lng: number
        googlePlaceId: string | null
      }>
    >`
      SELECT id, name, slug, lat, lng, "googlePlaceId" FROM "Venue"
      WHERE lat IS NOT NULL AND lng IS NOT NULL
        AND ABS(lat - ${place.lat}) < 0.001
        AND ABS(lng - ${place.lng}) < 0.001
    `

    const normalizedName = normalizeString(place.name)
    for (const v of nearbyVenues) {
      const dist = haversineDistance(place.lat, place.lng, v.lat, v.lng)
      if (dist < 50 && normalizeString(v.name) === normalizedName) {
        return {
          isDuplicate: true,
          existingVenue: { ...v, googlePlaceId: v.googlePlaceId },
          similarity: 95,
          matchType: 'name_location',
        }
      }
    }

    return { isDuplicate: false, similarity: 0, matchType: 'none' }
  }

  async detectDuplicatesBatch(
    places: GooglePlaceNormalized[]
  ): Promise<Map<string, DuplicateCheckResult>> {
    const results = new Map<string, DuplicateCheckResult>()
    const placeIds = places.map((p) => p.google_place_id).filter(Boolean)

    if (placeIds.length > 0) {
      const existing = await prisma.venue.findMany({
        where: { googlePlaceId: { in: placeIds } } as any,
        select: { id: true, name: true, slug: true, googlePlaceId: true },
      })
      const existingMap = new Map(existing.map((v: any) => [v.googlePlaceId, v]))

      for (const place of places) {
        if (place.google_place_id && existingMap.has(place.google_place_id)) {
          const venue = existingMap.get(place.google_place_id)!
          results.set(place.google_place_id, {
            isDuplicate: true,
            existingVenue: { ...venue, googlePlaceId: venue.googlePlaceId as string | null },
            similarity: 100,
            matchType: 'google_place_id',
          })
        }
      }
    }

    for (const place of places) {
      if (results.has(place.google_place_id)) continue
      const dup = await this.detectDuplicate(place)
      results.set(place.google_place_id, dup)
    }

    return results
  }

  async savePlace(
    place: GooglePlaceNormalized,
    categoryId: string,
    userId: string,
    duplicateAction: 'skip' | 'update' = 'skip'
  ): Promise<{ venueId: string; action: 'created' | 'updated' | 'skipped' }> {
    const duplicate = await this.detectDuplicate(place)

    if (duplicate.isDuplicate && duplicate.existingVenue) {
      if (duplicateAction === 'skip') {
        return { venueId: duplicate.existingVenue.id, action: 'skipped' }
      }

      if (duplicateAction === 'update') {
        await prisma.venue.update({
          where: { id: duplicate.existingVenue.id },
          data: {
            name: place.name,
            location: place.address,
            lat: place.lat,
            lng: place.lng,
            address: place.address,
            phone: place.phone,
            googlePlaceId: place.google_place_id,
          } as any,
        })
        return { venueId: duplicate.existingVenue.id, action: 'updated' }
      }
    }

    const slug = `${buildSlug(place.name)}-${Date.now().toString(36).slice(-4)}`
    const venue = await prisma.venue.create({
      data: {
        name: place.name,
        slug,
        description: `Importado desde Google Places: ${place.name}`,
        location: place.address || `${place.lat}, ${place.lng}`,
        lat: place.lat,
        lng: place.lng,
        address: place.address,
        phone: place.phone,
        status: 'APPROVED',
        categoryId,
        userId,
        googlePlaceId: place.google_place_id,
      } as any,
    })

    return { venueId: venue.id, action: 'created' }
  }
}

export const googlePlacesImporter = new GooglePlacesImporter()
