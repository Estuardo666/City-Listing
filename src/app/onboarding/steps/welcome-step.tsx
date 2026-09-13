'use client'

import { CalendarDays, Heart, SlidersHorizontal } from 'lucide-react'
import { DiscoveryIcon } from '@/components/onboarding/discovery-icon'
import { LIFESTYLE_OPTIONS } from '@/lib/constants/onboarding'
import type { getOnboardingVenueCategories } from '@/lib/queries/onboarding'

type Category = Awaited<ReturnType<typeof getOnboardingVenueCategories>>[number]

interface FollowingVenueData {
  id: string
  name: string
  slug: string
  image: string | null
  avgRating: number | null
  reviewCount: number
  venueCategories: { category: { id: string; name: string; icon: string | null } }[]
}

interface WelcomeStepProps {
  interests: Category[]
  preferences: string[]
  followingVenues: FollowingVenueData[]
}

export function WelcomeStep({ interests, preferences, followingVenues }: WelcomeStepProps) {
  const selectedPreferences = LIFESTYLE_OPTIONS.filter((option) => preferences.includes(option.id))

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="border-b border-border bg-foreground px-5 py-5 text-background sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/65">Tu cartelera personal</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Loja, ordenada para ti</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-background/70">
            Primero verás coincidencias con tus intereses. Después, lo más relevante de la ciudad.
          </p>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-3">
          <div className="bg-card p-5">
            <CalendarDays className="h-5 w-5 text-primary" />
            <p className="mt-4 text-2xl font-semibold tabular-nums">{interests.length}</p>
            <p className="text-xs text-muted-foreground">temas elegidos</p>
          </div>
          <div className="bg-card p-5">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <p className="mt-4 text-2xl font-semibold tabular-nums">{selectedPreferences.length}</p>
            <p className="text-xs text-muted-foreground">formas de disfrutar Loja</p>
          </div>
          <div className="bg-card p-5">
            <Heart className="h-5 w-5 text-primary" />
            <p className="mt-4 text-2xl font-semibold tabular-nums">{followingVenues.length}</p>
            <p className="text-xs text-muted-foreground">lugares seguidos</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Resumen de preferencias">
        {interests.slice(0, 5).map((interest) => (
          <span key={interest.id} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground">
            <DiscoveryIcon category={interest} className="h-3.5 w-3.5 text-primary" />
            {interest.name}
          </span>
        ))}
        {selectedPreferences.slice(0, 3).map((option) => (
          <span key={option.id} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground">
            <DiscoveryIcon lifestyleIcon={option.icon} className="h-3.5 w-3.5 text-primary" />
            {option.label}
          </span>
        ))}
      </div>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Podrás cambiar todo esto en Configuración → Preferencias de descubrimiento.
      </p>
    </div>
  )
}
