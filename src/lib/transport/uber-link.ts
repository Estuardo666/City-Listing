import type { UberPickupParams } from './types'

const UBER_BASE_URL = 'https://m.uber.com/ul/'

type GenerateUberLinkParams = {
  latitude: number
  longitude: number
  pickupLatitude?: number
  pickupLongitude?: number
}

export function generateUberLink({
  latitude,
  longitude,
  pickupLatitude,
  pickupLongitude,
}: GenerateUberLinkParams & UberPickupParams): string {
  const params = [
    `action=setPickup`,
    `dropoff[latitude]=${latitude}`,
    `dropoff[longitude]=${longitude}`,
  ]

  if (pickupLatitude !== undefined && pickupLongitude !== undefined) {
    params.push(`pickup[latitude]=${pickupLatitude}`)
    params.push(`pickup[longitude]=${pickupLongitude}`)
  }

  return `${UBER_BASE_URL}?${params.join('&')}`
}

export const UBER_BRAND_COLOR = '#000000'
