'use client'

import dynamic from 'next/dynamic'
import { Map as MapIcon } from 'lucide-react'
import type { ExploreEvent, ExploreVenue } from '@/types/explore'

type HomeHeroMapProps = {
  venues: ExploreVenue[]
  events: ExploreEvent[]
  mapboxToken: string
  mapStyle: string
}

export const HomeHeroMapDynamic = dynamic<HomeHeroMapProps>(
  () => import('./home-hero-map').then((mod) => mod.HomeHeroMap),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[85vh] w-full bg-muted/30 flex flex-col items-center justify-center gap-4 border-y border-border/60">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-sm">
          <MapIcon className="h-8 w-8 text-primary animate-pulse" />
          <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/20 animate-ping" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Cargando mapa interactivo...</p>
      </div>
    )
  }
)
