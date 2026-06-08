import { Car, Map } from 'lucide-react'
import type { TransportProvider } from './types'
import { generateUberLink, UBER_BRAND_COLOR } from './uber-link'
import { generateGoogleMapsLink, GOOGLE_MAPS_BRAND_COLOR } from './google-maps-link'

export const uberProvider: TransportProvider = {
  id: 'uber',
  name: 'Uber',
  icon: Car,
  brandColor: UBER_BRAND_COLOR,
  generateLink: generateUberLink,
  isAvailable: ({ latitude, longitude }) => latitude !== null && longitude !== null,
}

export const googleMapsProvider: TransportProvider = {
  id: 'google-maps',
  name: 'Google Maps',
  icon: Map,
  brandColor: GOOGLE_MAPS_BRAND_COLOR,
  generateLink: generateGoogleMapsLink,
  isAvailable: ({ latitude, longitude }) => latitude !== null && longitude !== null,
}

export const transportProviders: TransportProvider[] = [
  uberProvider,
  googleMapsProvider,
]

export type { TransportProvider, TransportLocationParams } from './types'
