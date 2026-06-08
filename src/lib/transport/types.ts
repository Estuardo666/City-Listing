import type { LucideIcon } from 'lucide-react'

export type TransportLocationParams = {
  latitude: number
  longitude: number
  name: string
}

export type UberPickupParams = {
  pickupLatitude?: number
  pickupLongitude?: number
}

export type TransportProvider = {
  id: string
  name: string
  icon: LucideIcon
  brandColor: string
  generateLink: (params: TransportLocationParams & UberPickupParams) => string
  isAvailable: (params: { latitude: number | null; longitude: number | null }) => boolean
}
