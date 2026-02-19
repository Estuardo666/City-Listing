import Link from 'next/link'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  EventEmptyState,
  EventFiltersClient,
  EventContent,
  EventsMap,
  EventsVenuesMap,
  UpcomingEventNotifications,
} from '@/components/features/events'
import {
  getEventCategories,
  getEvents,
  getEventsForMap,
  getUpcomingEventNotifications,
} from '@/lib/queries/events'
import {
  getVenuesForMap,
} from '@/lib/queries/venues'
import { eventListFiltersSchema } from '@/schemas/event.schema'

function getParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

type EventosPageProps = {
  searchParams: Promise<{
    q?: string | string[]
    category?: string | string[]
    featured?: string | string[]
  }>
}

export default async function EventosPage({ searchParams }: EventosPageProps) {
  const resolvedSearchParams = await searchParams

  const parsedFilters = eventListFiltersSchema.parse({
    q: getParamValue(resolvedSearchParams.q),
    category: getParamValue(resolvedSearchParams.category),
    featured: getParamValue(resolvedSearchParams.featured) || 'all',
    status: 'APPROVED',
  })

  const [events, categories, mapEvents, mapVenues, upcomingNotifications] = await Promise.all([
    getEvents(parsedFilters),
    getEventCategories(),
    getEventsForMap(),
    getVenuesForMap(),
    getUpcomingEventNotifications({ hoursAhead: 72, limit: 4 }),
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
              <span className="badge-coral">
                <CalendarDays className="h-3 w-3" /> Agenda verificada
              </span>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Eventos en Loja
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Descubre conciertos, cultura y actividades recomendadas por la comunidad. Filtra por categoría y encuentra ubicaciones en el mapa.
              </p>
            </div>
            <Button asChild className="press-scale h-10 shrink-0 rounded-xl px-5">
              <Link href="/dashboard" className="inline-flex items-center gap-2">
                Publicar evento
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <EventFiltersClient categories={categories} />

        {/* Count bar */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/40 px-4 py-2.5">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{events.length}</span>{' '}
            {events.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
          </p>
          <span className="badge-emerald">
            <CalendarDays className="h-3 w-3" /> Solo aprobados
          </span>
        </div>

        {/* Map + Upcoming */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_0.9fr]">
          <EventsVenuesMap
            events={mapEvents}
            venues={mapVenues}
            mapboxToken={mapboxToken}
            mapStyle={mapStyle}
            className="h-full"
          />
          <UpcomingEventNotifications
            notifications={upcomingNotifications}
            title="Próximas 72 horas"
            emptyLabel="No hay eventos próximos en la agenda inmediata."
          />
        </div>

        <EventContent initialEvents={events} hasFilters={hasFilters} />
      </section>
    </div>
  )
}
