import type { TransportLocationParams } from './types'

export function generateGoogleMapsLink({
  latitude,
  longitude,
  name,
}: TransportLocationParams): string {
  const query = encodeURIComponent(`${name}`)
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${query}`
}

export const GOOGLE_MAPS_BRAND_COLOR = '#4285F4'
