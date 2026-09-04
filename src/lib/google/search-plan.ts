import { GOOGLE_CATEGORIES } from '@/types/google-import'

export interface SearchRectangle {
  low: { latitude: number; longitude: number }
  high: { latitude: number; longitude: number }
}

// A city-wide query is ranked and capped by Google. Search each category in
// smaller sectors too, without an address in the text overriding the location.
export function buildSearchPlan(location: { lat: number; lng: number }, radius: number, keys: string[]) {
  const latDelta = radius / 111195
  const lngDelta = latDelta / Math.max(0.01, Math.cos(location.lat * Math.PI / 180))
  const wrap = (lng: number) => ((lng + 540) % 360) - 180
  const rectangle = (x: number, y: number, size: number): SearchRectangle => ({
    low: { latitude: Math.max(-90, location.lat + y * latDelta), longitude: wrap(location.lng + x * lngDelta) },
    high: { latitude: Math.min(90, location.lat + (y + size) * latDelta), longitude: wrap(location.lng + (x + size) * lngDelta) },
  })
  const areas = [rectangle(-1, -1, 2)]
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) areas.push(rectangle(-1 + x * 2 / 3, -1 + y * 2 / 3, 2 / 3))
  }
  const categories = [...new Set(keys)].filter((key) => Object.prototype.hasOwnProperty.call(GOOGLE_CATEGORIES, key))
  // All categories get an initial pass before starting the sector passes.
  return areas.flatMap((area) => categories.map((key) => ({ query: GOOGLE_CATEGORIES[key].label, area })))
}

export function isWithinSearchRadius(point: { latitude: number; longitude: number } | undefined, center: { lat: number; lng: number }, radius: number) {
  if (!point) return false
  const radians = Math.PI / 180
  const a = Math.sin((point.latitude - center.lat) * radians / 2) ** 2
    + Math.cos(center.lat * radians) * Math.cos(point.latitude * radians)
    * Math.sin((point.longitude - center.lng) * radians / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))) <= radius
}
