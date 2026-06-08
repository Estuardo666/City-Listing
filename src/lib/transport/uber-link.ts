import type { TransportLocationParams, UberPickupParams } from './types'

const UBER_BASE_URL = 'https://m.uber.com/ul/'

export function generateUberLink({
  latitude,
  longitude,
  name,
  pickupLatitude,
  pickupLongitude,
}: TransportLocationParams & UberPickupParams): string {
  const params = [
    `action=setPickup`,
    `dropoff[latitude]=${latitude}`,
    `dropoff[longitude]=${longitude}`,
    `dropoff[nickname]=${encodeURIComponent(name)}`,
  ]

  if (pickupLatitude !== undefined && pickupLongitude !== undefined) {
    params.push(`pickup[latitude]=${pickupLatitude}`)
    params.push(`pickup[longitude]=${pickupLongitude}`)
  }

  return `${UBER_BASE_URL}?${params.join('&')}`
}

export const UBER_BRAND_COLOR = '#000000'
