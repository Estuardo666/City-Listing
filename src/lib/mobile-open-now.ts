import { openStatus, parseHHMM, lojaNowParts, type HoursRow, type SpecialHoursRow } from './loja-day'

const FALLBACK_CATEGORIES = new Set([
  'alojamiento', 'alojamientos', 'hoteles', 'hotel', 'salud', 'salud-bienestar',
])

export function mobileOpenNowEligibility(
  hours: HoursRow[], categories: { slug: string }[], now: Date,
  specialToday?: SpecialHoursRow, specialYesterday?: SpecialHoursRow,
) {
  const excludedFromDefault = categories.length > 0 &&
    categories.every(category => FALLBACK_CATEGORIES.has(category.slug))
  const valid = hours.filter(row => parseHHMM(row.openTime) !== null && parseHHMM(row.closeTime) !== null)
  const { weekday } = lojaNowParts(now)
  const today = specialToday ? [specialToday] : valid.filter(row => row.dayOfWeek === weekday)
  const fullDay = today.some(row => !row.isClosed && row.openTime === row.closeTime && parseHHMM(row.openTime) !== null)
  const isOpen = openStatus(hours, { now, specialToday, specialYesterday }).isOpen
  return {
    include: isOpen && (excludedFromDefault || !fullDay),
    excludedFromDefault,
    is24HourFallback: excludedFromDefault && isOpen && fullDay,
  }
}

export function mobileOpenNowDefaultExclusions(
  items: Array<{ excludedFromDefault: boolean; is24HourFallback: boolean }>,
) {
  const hasStandardVenue = items.some(item => !item.excludedFromDefault)
  return items.map(item => hasStandardVenue ? item.excludedFromDefault : !item.is24HourFallback)
}
