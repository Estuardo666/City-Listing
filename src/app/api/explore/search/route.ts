import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withCache, getCacheKey, CACHE_TTL } from '@/lib/cache'
import { Prisma } from '@prisma/client'

const DEFAULT_TAKE = 60
const MAX_TAKE = 100

async function resolveCategorySlugs(slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return []
  const categories = await prisma.category.findMany({
    where: { slug: { in: slugs } },
    select: {
      slug: true,
      subcategories: { select: { slug: true } },
    },
  })
  const allSlugs = new Set<string>()
  for (const cat of categories) {
    allSlugs.add(cat.slug)
    for (const sub of cat.subcategories) {
      allSlugs.add(sub.slug)
    }
  }
  return Array.from(allSlugs)
}

function getDateRange(preset: string): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (preset) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'tomorrow':
      start.setDate(start.getDate() + 1)
      start.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() + 1)
      end.setHours(23, 59, 59, 999)
      break
    case 'thisWeek': {
      const dayOfWeek = now.getDay()
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      start.setDate(now.getDate() + diffToMonday)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'thisWeekend': {
      const dow = now.getDay()
      const diffToSaturday = dow === 0 ? -1 : 6 - dow
      start.setDate(now.getDate() + diffToSaturday)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 1)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'thisMonth':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      break
  }
  return { start, end }
}

function getCurrentDayAndTime(): { dayOfWeek: number; currentTime: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return { dayOfWeek, currentTime: `${hours}:${minutes}` }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all'
    const category = searchParams.get('category') || ''
    const featured = searchParams.get('featured') === 'true'
    const takeParam = Number(searchParams.get('take') ?? DEFAULT_TAKE)
    const take = Number.isFinite(takeParam)
      ? Math.min(Math.max(1, Math.floor(takeParam)), MAX_TAKE)
      : DEFAULT_TAKE
    const venueSkipParam = Number(searchParams.get('venueSkip') ?? '0')
    const eventSkipParam = Number(searchParams.get('eventSkip') ?? '0')
    const venueSkip = Number.isFinite(venueSkipParam) ? Math.max(0, Math.floor(venueSkipParam)) : 0
    const eventSkip = Number.isFinite(eventSkipParam) ? Math.max(0, Math.floor(eventSkipParam)) : 0
    const pageTake = take + 1

    // New filter params
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : null
    const openNow = searchParams.get('openNow') === 'true'
    const verified = searchParams.get('verified') === 'true'
    const hasPromotions = searchParams.get('hasPromotions') === 'true'
    const hasUpcomingEvents = searchParams.get('hasUpcomingEvents') === 'true'
    const priceRange = searchParams.get('priceRange') || null
    const services = searchParams.get('services') ? searchParams.get('services')!.split(',').filter(Boolean) : []
    const foodTypes = searchParams.get('foodTypes') ? searchParams.get('foodTypes')!.split(',').filter(Boolean) : []
    const eventDatePreset = searchParams.get('eventDatePreset') || null
    const eventPrice = searchParams.get('eventPrice') as 'free' | 'paid' | null
    const eventMaxPrice = searchParams.get('eventMaxPrice') ? parseFloat(searchParams.get('eventMaxPrice')!) : null
    const eventType = searchParams.get('eventType') || null

    // Proximity params
    const latParam = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
    const lngParam = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
    const radiusParam = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : null
    const hasProximity = latParam !== null && lngParam !== null && radiusParam !== null && radiusParam > 0

    // Compute bounding box for proximity filter
    const proximityBounds = hasProximity
      ? (() => {
          const latR = radiusParam! / 111320
          const lngR = radiusParam! / (111320 * Math.cos((latParam! * Math.PI) / 180))
          return {
            latMin: latParam! - latR,
            latMax: latParam! + latR,
            lngMin: lngParam! - lngR,
            lngMax: lngParam! + lngR,
          }
        })()
      : null

    // Haversine distance in meters
    const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371000
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLng = ((lng2 - lng1) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    const cacheKey = getCacheKey(
      'explore', q, type, category, String(featured), String(take),
      String(venueSkip), String(eventSkip),
      String(minRating), String(openNow), String(verified),
      String(hasPromotions), String(hasUpcomingEvents),
      priceRange ?? '', services.join(','), foodTypes.join(','),
      eventDatePreset ?? '', eventPrice ?? '', String(eventMaxPrice ?? ''),
      eventType ?? ''
    )

    const result = await withCache(
      cacheKey,
      async () => {
        const textFilter = q ? { contains: q, mode: 'insensitive' as const } : undefined

        // Resolve category slugs to include subcategories
        const categorySlugs = category ? await resolveCategorySlugs(category.split(',').filter(Boolean)) : []

        // ── Venue query ──
        const venueQuery = type === 'events' ? Promise.resolve([]) : (async () => {
          const where: Prisma.VenueWhereInput = {
            status: 'APPROVED',
            ...(textFilter && {
              OR: [
                { name: textFilter },
                { description: textFilter },
                { location: textFilter },
                { address: textFilter },
                { venueCategories: { some: { category: { name: textFilter } } } },
              ],
            }),
            ...(categorySlugs.length > 0 && { venueCategories: { some: { category: { slug: { in: categorySlugs } } } } }),
            ...(featured && { featured: true }),
            ...(minRating !== null && { avgRating: { gte: minRating } }),
            ...(verified && { verified: true }),
            ...(priceRange && { priceRange }),
            ...(proximityBounds && {
              lat: { gte: proximityBounds.latMin, lte: proximityBounds.latMax },
              lng: { gte: proximityBounds.lngMin, lte: proximityBounds.lngMax },
            }),
          }

          // Post-fetch filters need extra data
          const needsPostFilter = services.length > 0 || hasPromotions || hasUpcomingEvents || openNow

          const venueRows = await prisma.venue.findMany({
            where,
            orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
            skip: venueSkip,
            take: needsPostFilter ? MAX_TAKE : pageTake,
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              image: true,
              location: true,
              address: true,
              lat: true,
              lng: true,
              featured: true,
              phone: true,
              website: true,
              priceRange: true,
              avgRating: true,
              reviewCount: true,
              verified: true,
              venueCategories: {
                select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } },
              },
              services: { where: { isActive: true }, select: { name: true } },
              promotions: {
                where: { status: 'ACTIVE', validUntil: { gte: new Date() } },
                select: { id: true, title: true, discount: true },
              },
              businessHours: {
                select: { dayOfWeek: true, openTime: true, closeTime: true, isClosed: true },
              },
              events: hasUpcomingEvents ? {
                where: { status: 'APPROVED', startDate: { gte: new Date() } },
                select: { id: true },
                take: 1,
              } : undefined,
            },
          })

          // Post-fetch filters
          let filtered = venueRows

          if (services.length > 0) {
            filtered = filtered.filter((v) => {
              const vServices = (v as any).services as { name: string }[] | undefined
              if (!vServices) return false
              const names = vServices.map((s) => s.name)
              return services.every((s) => names.includes(s))
            })
          }

          if (hasPromotions) {
            filtered = filtered.filter((v) => {
              const promos = (v as any).promotions as { id: string }[] | undefined
              return promos && promos.length > 0
            })
          }

          if (hasUpcomingEvents) {
            filtered = filtered.filter((v) => {
              const evts = (v as any).events as { id: string }[] | undefined
              return evts && evts.length > 0
            })
          }

          if (openNow) {
            const { dayOfWeek, currentTime } = getCurrentDayAndTime()
            filtered = filtered.filter((v) => {
              const hours = (v as any).businessHours as { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[] | undefined
              if (!hours || hours.length === 0) return false
              const todayHours = hours.filter((h) => h.dayOfWeek === dayOfWeek && !h.isClosed)
              return todayHours.some((h) => h.openTime <= currentTime && h.closeTime > currentTime)
            })
          }

          if (foodTypes.length > 0) {
            const keywords = foodTypes.map((f) => f.toLowerCase())
            filtered = filtered.filter((v) => {
              const text = `${v.name} ${v.description}`.toLowerCase()
              return keywords.some((kw) => text.includes(kw))
            })
          }

          // Proximity distance filter (exact haversine within bounding box)
          if (hasProximity) {
            filtered = filtered.filter((v) => {
              if (v.lat === null || v.lng === null) return false
              return haversine(latParam!, lngParam!, v.lat, v.lng) <= radiusParam!
            })
          }

          // Clean up extra fields before returning
          return filtered.slice(0, take).map((v) => {
            const { events: _e, venueCategories, ...rest } = v as any
            return {
              ...rest,
              categories: venueCategories?.map((vc: any) => vc.category) ?? [],
            }
          })
        })()

        // ── Event query ──
        const eventQuery = type === 'venues' ? Promise.resolve([]) : (async () => {
          const where: Prisma.EventWhereInput = {
            status: 'APPROVED',
            ...(textFilter && {
              OR: [
                { title: textFilter },
                { description: textFilter },
                { location: textFilter },
                { address: textFilter },
                { eventCategories: { some: { category: { name: textFilter } } } },
              ],
            }),
            ...(categorySlugs.length > 0 && { eventCategories: { some: { category: { slug: { in: categorySlugs } } } } }),
            ...(featured && { featured: true }),
            ...(minRating !== null && { avgRating: { gte: minRating } }),
            ...(eventDatePreset && (() => {
              const { start, end } = getDateRange(eventDatePreset)
              return { startDate: { gte: start, lte: end } }
            })()),
            ...(eventPrice === 'free' && {
              OR: [{ price: null }, { price: 0 }],
            }),
            ...(eventPrice === 'paid' && { price: { gt: 0 } }),
            ...(eventMaxPrice !== null && { price: { lte: eventMaxPrice } }),
            ...(eventType && { eventCategories: { some: { category: { slug: eventType } } } }),
            ...(proximityBounds && {
              lat: { gte: proximityBounds.latMin, lte: proximityBounds.latMax },
              lng: { gte: proximityBounds.lngMin, lte: proximityBounds.lngMax },
            }),
          }

          const eventRows = await prisma.event.findMany({
            where,
            orderBy: [{ featured: 'desc' }, { startDate: 'asc' }],
            skip: eventSkip,
            take: pageTake,
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              image: true,
              startDate: true,
              endDate: true,
              location: true,
              address: true,
              lat: true,
              lng: true,
              featured: true,
              price: true,
              avgRating: true,
              reviewCount: true,
              eventCategories: {
                select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } },
              },
            },
          })

          let filteredEvents = eventRows

          // Proximity distance filter (exact haversine within bounding box)
          if (hasProximity) {
            filteredEvents = filteredEvents.filter((e) => {
              if (e.lat === null || e.lng === null) return false
              return haversine(latParam!, lngParam!, e.lat, e.lng) <= radiusParam!
            })
          }

          return filteredEvents.slice(0, take).map((e) => {
            const { eventCategories, ...rest } = e as any
            return {
              ...rest,
              categories: eventCategories?.map((ec: any) => ec.category) ?? [],
            }
          })
        })()

        const [venues, events] = await Promise.all([venueQuery, eventQuery])

        const hasMoreVenues = type !== 'events' && venues.length >= take
        const hasMoreEvents = type !== 'venues' && events.length >= take
        const nextVenueSkip = venueSkip + venues.length
        const nextEventSkip = eventSkip + events.length

        return {
          venues,
          events,
          pageInfo: {
            hasMoreVenues,
            hasMoreEvents,
            nextVenueSkip,
            nextEventSkip,
          },
        }
      },
      5 * 60
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Explore search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
