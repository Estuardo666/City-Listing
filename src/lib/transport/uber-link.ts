import type { TransportLocationParams, UberPickupParams } from './types'

const UBER_BASE_URL = 'https://m.uber.com/ul/'

export function generateUberLink({
  latitude,
  longitude,
  name,
  pickupLatitude,
  pickupLongitude,
}: TransportLocationParams & UberPickupParams): string {
  const params = new URLSearchParams()

  params.set('action', 'setPickup')
  params.set('dropoff[latitude]', latitude.toString())
  params.set('dropoff[longitude]', longitude.toString())
  params.set('dropoff[nickname]', name)

  if (pickupLatitude !== undefined && pickupLongitude !== undefined) {
    params.set('pickup[latitude]', pickupLatitude.toString())
    params.set('pickup[longitude]', pickupLongitude.toString())
  }

  return `${UBER_BASE_URL}?${params.toString()}`
}

export const UBER_BRAND_COLOR = '#000000'
