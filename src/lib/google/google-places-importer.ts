import 'server-only'
import { prisma } from '@/lib/prisma'
import { googlePlacesService } from '@/lib/google-places'
import type { GooglePlaceNormalized, DuplicateCheckResult } from '@/types/google-import'
import { GOOGLE_CATEGORIES } from '@/types/google-import'
import { getCategoriesFromGoogleTypes } from '@/lib/google/google-type-mapper'

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

async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = buildSlug(name)
  let candidate = baseSlug
  let suffix = 1

  while (true) {
    const existing = await prisma.venue.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!existing) return candidate
    suffix++
    candidate = `${baseSlug}-${suffix}`
  }
}

function normalizeWebsite(details: any): string | null {
  return details.websiteUri || null
}

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  domingo: 0,
  lunes: 1,
  martes: 2,
  miércoles: 3,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
  sabado: 6,
}

function parseTime12to24(timeStr: string): string {
  const cleaned = timeStr.trim()

  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/)
  if (match24) return `${match24[1].padStart(2, '0')}:${match24[2]}`

  const matchEN = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (matchEN) {
    let hours = parseInt(matchEN[1], 10)
    const minutes = matchEN[2]
    const period = matchEN[3].toUpperCase()
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return `${String(hours).padStart(2, '0')}:${minutes}`
  }

  const matchESam = cleaned.match(/^(\d{1,2}):(\d{2})\s*a\.?\s*m\.?$/i)
  if (matchESam) return `${matchESam[1].padStart(2, '0')}:${matchESam[2]}`

  const matchESpm = cleaned.match(/^(\d{1,2}):(\d{2})\s*p\.?\s*m\.?$/i)
  if (matchESpm) {
    let hours = parseInt(matchESpm[1], 10) + 12
    if (hours === 24) hours = 12
    return `${String(hours).padStart(2, '0')}:${matchESpm[2]}`
  }

  return cleaned
}

export function normalizeOpeningHours(
  details: any
): Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }> {
  const descriptions: string[] = details?.regularOpeningHours?.weekdayDescriptions
  if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) return []

  const result: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }> = []

  for (const desc of descriptions) {
    const colonIndex = desc.indexOf(':')
    if (colonIndex === -1) continue

    const dayName = desc.substring(0, colonIndex).trim().toLowerCase()
    const dayOfWeek = DAY_MAP[dayName]
    if (dayOfWeek === undefined) continue

    const timePart = desc.substring(colonIndex + 1).trim()

    if (/closed|cerrado/i.test(timePart)) {
      result.push({ dayOfWeek, openTime: '00:00', closeTime: '00:00', isClosed: true })
      continue
    }

    if (/open 24 hours|abierto las 24 horas|abierto 24 horas/i.test(timePart)) {
      result.push({ dayOfWeek, openTime: '00:00', closeTime: '23:59', isClosed: false })
      continue
    }

    const ranges = timePart.split(',').map((r) => r.trim()).filter(Boolean)
    for (const range of ranges) {
      const parts = range.split(/\s*[–-]\s*/)
      if (parts.length !== 2) continue

      const openTime = parseTime12to24(parts[0].trim())
      const closeTime = parseTime12to24(parts[1].trim())

      result.push({ dayOfWeek, openTime, closeTime, isClosed: false })
    }
  }

  return result
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

    const queryVariations = [
      (label: string) => `${label} en ${query}`,
      (label: string) => `${label} cerca de ${query}`,
    ]

    for (const key of typesToSearch) {
      const cat = GOOGLE_CATEGORIES[key]
      if (!cat) continue

      if (allResults.length >= maxResults) break

      for (const buildQuery of queryVariations) {
        if (allResults.length >= maxResults) break

        const typeQuery = buildQuery(cat.label)

        try {
          const { places: results } = await googlePlacesService.searchPlaces(typeQuery, {
            location,
            radius,
            maxResultCount: 20,
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
    }

    return allResults.slice(0, maxResults)
  }

  async searchPlacesPage(
    query: string,
    location: { lat: number; lng: number },
    radius: number,
    variationIndex: number,
    categoryKeys?: string[],
    pageToken?: string
  ): Promise<{ data: any[]; nextPageToken?: string; hasMore: boolean }> {
    const typesToSearch = categoryKeys && categoryKeys.length > 0
      ? categoryKeys
      : ['restaurant']

    const variations = [
      (label: string) => `${label} en ${query}`,
      (label: string) => `${label} cerca de ${query}`,
    ]

    const allCombos: Array<{ key: string; label: string; buildQuery: (label: string) => string }> = []
    for (const key of typesToSearch) {
      const cat = GOOGLE_CATEGORIES[key]
      if (!cat) continue
      for (const buildQuery of variations) {
        allCombos.push({ key, label: cat.label, buildQuery })
      }
    }

    if (variationIndex >= allCombos.length) {
      return { data: [], hasMore: false }
    }

    const combo = allCombos[variationIndex]
    const typeQuery = combo.buildQuery(combo.label)

    try {
      if (pageToken) {
        await new Promise((r) => setTimeout(r, 1000))
      }

      const { places, nextPageToken } = await googlePlacesService.searchPlaces(typeQuery, {
        location,
        radius,
        maxResultCount: 20,
        pageToken,
      })

      const hasMoreVariations = variationIndex < allCombos.length - 1
      const hasMore = !!nextPageToken || hasMoreVariations

      return { data: places, nextPageToken, hasMore }
    } catch (error) {
      console.error(`Error searching variation ${variationIndex}:`, error)
      return { data: [], hasMore: variationIndex < allCombos.length - 1 }
    }
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

  async getPlaceDetailsRaw(placeId: string): Promise<any | null> {
    try {
      return await googlePlacesService.getPlaceDetails(placeId)
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
        where: {
          googlePlaceId: place.google_place_id,
          status: { in: ['APPROVED', 'PENDING'] },
        } as any,
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
          where: {
            phone: normalizedPhone,
            status: { in: ['APPROVED', 'PENDING'] },
          },
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
        AND status IN ('APPROVED', 'PENDING')
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
        where: {
          googlePlaceId: { in: placeIds },
          status: { in: ['APPROVED', 'PENDING'] },
        } as any,
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
    categoryIds: string[],
    userId: string,
    duplicateAction: 'skip' | 'update' = 'skip'
  ): Promise<{ venueId: string; action: 'created' | 'updated' | 'skipped' }> {
    const duplicate = await this.detectDuplicate(place)

    if (duplicate.isDuplicate && duplicate.existingVenue) {
      if (duplicateAction === 'skip') {
        return { venueId: duplicate.existingVenue.id, action: 'skipped' }
      }

      if (duplicateAction === 'update') {
        const details = await this.getPlaceDetailsRaw(place.google_place_id)
        const website = details ? normalizeWebsite(details) : null
        const hours = details ? normalizeOpeningHours(details) : []
        const now = new Date()

        await prisma.venue.update({
          where: { id: duplicate.existingVenue.id },
          data: {
            name: place.name,
            location: place.address,
            lat: place.lat,
            lng: place.lng,
            address: place.address,
            phone: place.phone,
            website,
            googlePlaceId: place.google_place_id,
            sourceLastSync: now,
            hoursLastSync: hours.length > 0 ? now : undefined,
          } as any,
        })

        if (hours.length > 0) {
          await prisma.venueBusinessHours.deleteMany({ where: { venueId: duplicate.existingVenue.id } })
          await prisma.venueBusinessHours.createMany({
            data: hours.map((h) => ({ ...h, venueId: duplicate.existingVenue!.id })),
          })
        }

        if (categoryIds.length > 0) {
          const venueId = duplicate.existingVenue.id
          await prisma.venueCategory.deleteMany({ where: { venueId } })
          await prisma.venueCategory.createMany({
            data: categoryIds.map((categoryId) => ({ venueId, categoryId })),
          })
        }
        return { venueId: duplicate.existingVenue.id, action: 'updated' }
      }
    }

    const details = await this.getPlaceDetailsRaw(place.google_place_id)
    const website = details ? normalizeWebsite(details) : null
    const hours = details ? normalizeOpeningHours(details) : []
    const now = new Date()

    const slug = await generateUniqueSlug(place.name)
    const venue = await prisma.venue.create({
      data: {
        name: place.name,
        slug,
        description: '',
        location: place.address || `${place.lat}, ${place.lng}`,
        lat: place.lat,
        lng: place.lng,
        address: place.address,
        phone: place.phone,
        website,
        status: 'APPROVED',
        userId,
        googlePlaceId: place.google_place_id,
        sourceLastSync: now,
        hoursLastSync: hours.length > 0 ? now : null,
      } as any,
    })

    if (hours.length > 0) {
      await prisma.venueBusinessHours.createMany({
        data: hours.map((h) => ({ ...h, venueId: venue.id })),
      })
    }

    if (categoryIds.length > 0) {
      await prisma.venueCategory.createMany({
        data: categoryIds.map((categoryId) => ({ venueId: venue.id, categoryId })),
      })
    }

    return { venueId: venue.id, action: 'created' }
  }

  async resolveCategoryIds(types: string[]): Promise<string[]> {
    const result = await getCategoriesFromGoogleTypes(types)
    if (result.categorySlugs.length === 0) return []

    const categories = await prisma.category.findMany({
      where: { slug: { in: result.categorySlugs } },
      select: { id: true },
    })
    return categories.map((c) => c.id)
  }
}

export const googlePlacesImporter = new GooglePlacesImporter()
