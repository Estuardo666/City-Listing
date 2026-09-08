import { openStatus, parseHHMM, lojaNowParts, type HoursRow, type SpecialHoursRow } from './loja-day'

const EXCEPTIONS = new Set(['alojamiento', 'alojamientos', 'hoteles', 'hotel', 'salud'])

export function mobileOpenNowEligibility(
  hours: HoursRow[], categories: { slug: string }[], now: Date,
  specialToday?: SpecialHoursRow, specialYesterday?: SpecialHoursRow,
) {
  const excludedFromDefault = categories.some(category => EXCEPTIONS.has(category.slug))
  const valid = hours.filter(row => parseHHMM(row.openTime) !== null && parseHHMM(row.closeTime) !== null)
  const { weekday } = lojaNowParts(now)
  const today = specialToday ? [specialToday] : valid.filter(row => row.dayOfWeek === weekday)
  const fullDay = today.some(row => !row.isClosed && row.openTime === row.closeTime && parseHHMM(row.openTime) !== null)
  const unknown = valid.length === 0 && !specialToday && !specialYesterday
  const isOpen = openStatus(hours, { now, specialToday, specialYesterday }).isOpen
  return { include: excludedFromDefault ? (unknown || isOpen) : (isOpen && !fullDay), excludedFromDefault }
}
