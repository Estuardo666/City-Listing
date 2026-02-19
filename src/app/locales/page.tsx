import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  VenueEmptyState,
  VenueFiltersClient,
  VenueContent,
  VenuesMap,
} from '@/components/features/venues'
import {
  getVenueCategories,
  getVenues,
  getVenuesForMap,
} from '@/lib/queries/venues'
import { venueListFiltersSchema } from '@/schemas/venue.schema'

function getParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

type LocalesPageProps = {
  searchParams: Promise<{
    q?: string | string[]
    category?: string | string[]
    featured?: string | string[]
  }>
}

export default async function LocalesPage({ searchParams }: LocalesPageProps) {
  const resolvedSearchParams = await searchParams

  const parsedFilters = venueListFiltersSchema.parse({
    q: getParamValue(resolvedSearchParams.q),
    category: getParamValue(resolvedSearchParams.category),
    featured: getParamValue(resolvedSearchParams.featured) || 'all',
    status: 'APPROVED',
  })

  const [venues, categories, mapVenues] = await Promise.all([
    getVenues(parsedFilters),
    getVenueCategories(),
    getVenuesForMap(),
  ])

  const mapboxToken =
    process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
  const mapStyle =
    process.env.MAPBOX_STYLE ??
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    'mapbox://styles/mapbox/streets-v12'

  const hasFilters = Boolean(parsedFilters.q || parsedFilters.category || parsedFilters.featured === 'true')

  return (
    <div className="pb-16 pt-10 sm:pt-14">
      <section className="section-shell space-y-7">

        {/* Header */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <span className="badge-emerald">
                <MapPin className="h-3 w-3" /> Directorio local
              </span>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Locales verificados en Loja
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Restaurantes, cafés, bares y servicios recomendados por la comunidad y revisados por el equipo editorial.
              </p>
            </div>
            <Button asChild className="press-scale h-10 shrink-0 rounded-xl px-5">
              <Link href="/locales/crear" className="inline-flex items-center gap-2">
                Registrar local
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <VenueFiltersClient categories={categories} />

        {/* Count bar */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/40 px-4 py-2.5">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{venues.length}</span>{' '}
            {venues.length === 1 ? 'local encontrado' : 'locales encontrados'}
          </p>
          <span className="badge-emerald">
            <MapPin className="h-3 w-3" /> Solo verificados
          </span>
        </div>

        <VenuesMap venues={mapVenues} mapboxToken={mapboxToken} mapStyle={mapStyle} />

        <VenueContent initialVenues={venues} hasFilters={hasFilters} />
      </section>
    </div>
  )
}
