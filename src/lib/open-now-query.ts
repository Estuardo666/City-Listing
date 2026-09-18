import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatHHMM, lojaDay, lojaNowParts, openStatus } from '@/lib/loja-day'

export type SpecialHoursEntry = {
  today?: { openTime: string | null; closeTime: string | null; isClosed: boolean }
  yesterday?: { openTime: string | null; closeTime: string | null; isClosed: boolean }
}

export async function getSpecialHoursByVenue(now = new Date()): Promise<Map<string, SpecialHoursEntry>> {
  const { date, prevDate } = lojaNowParts(now)
  const rows = await prisma.specialHours.findMany({
    where: {
      date: {
        gte: new Date(`${prevDate}T00:00:00Z`),
        lt: new Date(new Date(`${date}T00:00:00Z`).getTime() + 86_400_000),
      },
    },
    select: { venueId: true, date: true, openTime: true, closeTime: true, isClosed: true },
  })

  const byVenue = new Map<string, SpecialHoursEntry>()
  for (const row of rows) {
    const day = lojaDay(row.date).date
    const entry = byVenue.get(row.venueId) ?? {}
    if (day === date) entry.today = row
    else if (day === prevDate) entry.yesterday = row
    else continue
    byVenue.set(row.venueId, entry)
  }
  return byVenue
}

/** SQL predicate shared by Explore and the home page. */
export function buildOpenNowFilter(
  specialsByVenue: Map<string, SpecialHoursEntry>,
  now = new Date(),
): Prisma.VenueWhereInput {
  const { weekday, prevWeekday, minute } = lojaNowParts(now)
  const currentTime = formatHHMM(minute)
  const regular: Prisma.VenueWhereInput = {
    businessHours: {
      some: {
        OR: [
          { dayOfWeek: weekday, isClosed: false, crossesMidnight: false, openMinute: { lte: minute }, closeMinute: { gt: minute } },
          // Keep CI and older schemas compatible when Prisma created the
          // nullable generated columns without applying their SQL expressions.
          { dayOfWeek: weekday, isClosed: false, openTime: { lte: currentTime }, closeTime: { gt: currentTime } },
          { dayOfWeek: weekday, isClosed: false, isAllDay: true },
          { dayOfWeek: weekday, isClosed: false, openTime: '00:00', closeTime: '00:00' },
          { dayOfWeek: weekday, isClosed: false, crossesMidnight: true, openMinute: { lte: minute } },
          { dayOfWeek: prevWeekday, isClosed: false, crossesMidnight: true, closeMinute: { gt: minute } },
        ],
      },
    },
  }

  if (specialsByVenue.size === 0) return regular

  const overriddenIds: string[] = []
  const openBySpecialIds: string[] = []
  for (const [venueId, entry] of specialsByVenue) {
    overriddenIds.push(venueId)
    if (openStatus([], {
      specialToday: entry.today ?? null,
      specialYesterday: entry.yesterday ?? null,
      now,
    }).isOpen) {
      openBySpecialIds.push(venueId)
    }
  }

  return {
    OR: [
      { AND: [regular, { id: { notIn: overriddenIds } }] },
      ...(openBySpecialIds.length > 0
        ? [{ id: { in: openBySpecialIds }, businessHours: { some: {} } }]
        : []),
    ],
  }
}
