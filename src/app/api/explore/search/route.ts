import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_TAKE = 60
const MAX_TAKE = 100

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all' // 'all' | 'venues' | 'events'
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

    const textFilter = q
      ? { contains: q }
      : undefined

    const venueQuery = type === 'events' ? Promise.resolve([]) : prisma.venue.findMany({
      where: {
        status: 'APPROVED',
        ...(textFilter && {
          OR: [
            { name: textFilter },
            { description: textFilter },
            { location: textFilter },
            { address: textFilter },
          ],
        }),
        ...(category && { category: { slug: category } }),
        ...(featured && { featured: true }),
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      skip: venueSkip,
      take: pageTake,
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
        category: {
          select: { id: true, name: true, slug: true, color: true, icon: true },
        },
      },
    })

    const eventQuery = type === 'venues' ? Promise.resolve([]) : prisma.event.findMany({
      where: {
        status: 'APPROVED',
        ...(textFilter && {
          OR: [
            { title: textFilter },
            { description: textFilter },
            { location: textFilter },
            { address: textFilter },
          ],
        }),
        ...(category && { category: { slug: category } }),
        ...(featured && { featured: true }),
      },
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
        category: {
          select: { id: true, name: true, slug: true, color: true, icon: true },
        },
      },
    })

    const [venueRows, eventRows] = await Promise.all([
      venueQuery,
      eventQuery,
    ])

    const venues = venueRows.slice(0, take)
    const events = eventRows.slice(0, take)
    const hasMoreVenues = type !== 'events' && venueRows.length > take
    const hasMoreEvents = type !== 'venues' && eventRows.length > take
    const nextVenueSkip = venueSkip + venues.length
    const nextEventSkip = eventSkip + events.length

    return NextResponse.json({
      venues,
      events,
      pageInfo: {
        hasMoreVenues,
        hasMoreEvents,
        nextVenueSkip,
        nextEventSkip,
      },
    })
  } catch (error) {
    console.error('Explore search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
