'use client'

import { Check, X } from 'lucide-react'
import type { VenueService } from '@prisma/client'

const YELP_AMENITIES = [
  { name: 'ASL proficient', icon: '🤟' },
  { name: 'Accepts cash', icon: '💵' },
  { name: 'Accepts credit cards', icon: '💳' },
  { name: 'Accepts Zelle', icon: '📱' },
  { name: 'Accepts Venmo', icon: '📱' },
  { name: 'Accepts PayPal', icon: '📱' },
  { name: 'Accepts Cash App', icon: '📱' },
  { name: 'Accepts cryptocurrency', icon: '₿' },
  { name: 'Offers military discount', icon: '🎖️' },
  { name: 'Open to All', icon: '🌍' },
  { name: 'WiFi', icon: '📶' },
  { name: 'Vista a la ciudad', icon: '🏙️' },
] as const

interface AmenitiesSectionProps {
  services: VenueService[]
}

export function AmenitiesSection({ services }: AmenitiesSectionProps) {
  const activeServices = services.filter((s) => s.isActive)
  if (activeServices.length === 0) return null

  const serviceNames = new Set(activeServices.map((s) => s.name.toLowerCase()))

  const matchedAmenities = YELP_AMENITIES.filter((a) =>
    serviceNames.has(a.name.toLowerCase())
  )
  const otherServices = activeServices.filter(
    (s) => !YELP_AMENITIES.some((a) => a.name.toLowerCase() === s.name.toLowerCase())
  )

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <h2 className="text-lg font-medium text-foreground mb-4">Comodidades y más</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        {matchedAmenities.map((amenity) => (
          <div key={amenity.name} className="flex items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm text-foreground">{amenity.name}</span>
          </div>
        ))}
        {otherServices.map((service) => (
          <div key={service.id} className="flex items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm text-foreground">{service.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
