import { openStatus, parseHHMM, lojaNowParts, type HoursRow, type SpecialHoursRow } from './loja-day'

const FALLBACK_CATEGORIES = new Set([
  'alojamiento', 'alojamientos', 'hoteles', 'hotel', 'salud', 'salud-bienestar', 'salud-y-bienestar',
])
const LODGING_NAME_HINT = /\b(?:hotel(?:es)?|hostal(?:es)?|hostel(?:s)?|motel(?:es)?|resort(?:s)?|lodge|hospedaje|h(?:o|ó)ster[ií]a)\b/i
const HEALTH_NAME_HINT = /\b(?:gym|gimnasio|fitness|dental|odontolog[ií]a|odont[oó]log|doctor|m[eé]dic|cl[ií]nic|clinic|hospital|farmacia|pharmacy|fisioter|veterin|spa)\b/i

type MobileVenueIdentity = { name?: string | null; slug?: string | null }

function inferredFallbackSlug(identity: MobileVenueIdentity) {
  const text = `${identity.name ?? ''} ${identity.slug ?? ''}`
  if (LODGING_NAME_HINT.test(text)) return 'alojamiento'
  if (HEALTH_NAME_HINT.test(text)) return 'salud-bienestar'
  return null
}

/** Repairs imported rows whose only stored category is Gastronomía but whose
 * venue identity clearly identifies lodging or health. */
export function mobileOpenNowCategories(
  categories: { slug: string; name: string }[], identity: MobileVenueIdentity,
) {
  if (categories.some(category => FALLBACK_CATEGORIES.has(category.slug))) return categories
  if (categories.some(category => category.slug !== 'gastronomia')) return categories
  const slug = inferredFallbackSlug(identity)
  if (!slug) return categories
  return [{
    slug,
    name: slug === 'alojamiento' ? 'Alojamiento' : 'Salud y Bienestar',
  }]
}

export function mobileOpenNowEligibility(
  hours: HoursRow[], categories: { slug: string }[], now: Date,
  specialToday?: SpecialHoursRow, specialYesterday?: SpecialHoursRow,
) {
  const excludedFromDefault = categories.length > 0 &&
    categories.every(category => FALLBACK_CATEGORIES.has(category.slug))
  const valid = hours.filter(row => parseHHMM(row.openTime) !== null && parseHHMM(row.closeTime) !== null)
  const hasKnownSchedule = valid.length > 0
  const { weekday } = lojaNowParts(now)
  const today = specialToday ? [specialToday] : valid.filter(row => row.dayOfWeek === weekday)
  const fullDay = today.some(row => !row.isClosed && row.openTime === row.closeTime && parseHHMM(row.openTime) !== null)
  const isOpen = openStatus(hours, { now, specialToday, specialYesterday }).isOpen
  return {
    include: hasKnownSchedule && isOpen && (excludedFromDefault || !fullDay),
    excludedFromDefault,
    is24HourFallback: excludedFromDefault && hasKnownSchedule && isOpen && fullDay,
  }
}

export function mobileOpenNowDefaultExclusions(
  items: Array<{ excludedFromDefault: boolean; is24HourFallback: boolean }>,
) {
  const hasStandardVenue = items.some(item => !item.excludedFromDefault)
  return items.map(item => hasStandardVenue ? item.excludedFromDefault : !item.is24HourFallback)
}
