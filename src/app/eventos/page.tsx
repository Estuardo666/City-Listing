import Link from 'next/link'
import type { Metadata } from 'next'
import { CalendarDays, Star, Sparkles, Tag, Ticket, LayoutGrid } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Agenda } from '@/components/features/events/agenda'
import { getEvents } from '@/lib/queries/events'
import { ExploreClient } from '@/components/features/explore/explore-client'
import { ListingSection } from '@/components/features/listing/listing-section'
import { ListingCta } from '@/components/features/listing/listing-cta'
import { NearYouSection } from '@/components/features/listing/near-you-section'
import type { ExploreEvent } from '@/types/explore'
import type { EventListItem } from '@/types/event'
import { JsonLd } from '@/components/json-ld'
import { buildBreadcrumbListJsonLd, buildEventLandingJsonLd } from '@/lib/seo/json-ld-builders'
import { dedupePublicEvents } from '@/lib/queries/events'

export const revalidate = 900

const EVENTS_SEO_DESCRIPTION =
  'Consulta qué hacer en Loja: agenda actualizada de conciertos, eventos culturales, ferias, Artes Vivas y otros planes con fechas, lugares y precios.'

export const metadata: Metadata = {
  title: 'Eventos en Loja: agenda de conciertos y actividades | Vive Loja',
  description: EVENTS_SEO_DESCRIPTION,
  openGraph: {
    title: 'Eventos en Loja: agenda de conciertos y actividades | Vive Loja',
    description: EVENTS_SEO_DESCRIPTION,
    url: 'https://viveloja.com/eventos',
    siteName: 'Vive Loja',
    images: [{ url: 'https://viveloja.com/viveloja.png', width: 1200, height: 630, alt: 'Eventos en Loja - Vive Loja' }],
    locale: 'es_EC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eventos en Loja: agenda de conciertos y actividades',
    description: EVENTS_SEO_DESCRIPTION,
    images: ['https://viveloja.com/viveloja.png'],
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  alternates: { canonical: 'https://viveloja.com/eventos' },
}

const FEATURED_TAKE = 6
const FREE_TAKE = 6
const TOP_RATED_TAKE = 6
const ALL_TAKE = 12

export default async function EventosPage() {
  const now = new Date()
  const [allApproved, featuredEvents, freeEvents, topRatedEvents, categories] = await Promise.all([
    getEvents({ status: 'APPROVED', upcoming: true }),
    prisma.event.findMany({
      where: {
        status: 'APPROVED',
        AND: [
          { OR: [{ startDate: { gte: now } }, { endDate: { gte: now } }] },
          { OR: [{ featured: true }, { sponsoredUntil: { gt: now } }] },
        ],
      },
      orderBy: [{ sponsoredUntil: 'desc' }, { featured: 'desc' }, { startDate: 'asc' }],
      take: FEATURED_TAKE,
      select: {
        id: true, title: true, slug: true, description: true, image: true,
        startDate: true, endDate: true, location: true, address: true,
        lat: true, lng: true, featured: true, sponsoredUntil: true, price: true, isRecurring: true,
        avgRating: true, reviewCount: true,
        eventCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
      },
    }),
    prisma.event.findMany({
      where: {
        status: 'APPROVED',
        price: 0,
        OR: [{ startDate: { gte: now } }, { endDate: { gte: now } }],
      },
      orderBy: { startDate: 'asc' },
      take: FREE_TAKE,
      select: {
        id: true, title: true, slug: true, description: true, image: true,
        startDate: true, endDate: true, location: true, address: true,
        lat: true, lng: true, featured: true, sponsoredUntil: true, price: true, isRecurring: true,
        avgRating: true, reviewCount: true,
        eventCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
      },
    }),
    prisma.event.findMany({
      where: {
        status: 'APPROVED',
        avgRating: { gte: 4 },
        OR: [{ startDate: { gte: now } }, { endDate: { gte: now } }],
      },
      orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
      take: TOP_RATED_TAKE,
      select: {
        id: true, title: true, slug: true, description: true, image: true,
        startDate: true, endDate: true, location: true, address: true,
        lat: true, lng: true, featured: true, sponsoredUntil: true, price: true, isRecurring: true,
        avgRating: true, reviewCount: true,
        eventCategories: { select: { category: { select: { id: true, name: true, slug: true, color: true, icon: true } } } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        subcategories: {
          select: { id: true, name: true, slug: true, icon: true },
          orderBy: { name: 'asc' },
        },
      },
    }),
  ])

  const publicEvents = dedupePublicEvents(allApproved)
  const allEvents = publicEvents.slice(0, ALL_TAKE) as EventListItem[]
  const upcomingEventsForSchema = publicEvents.slice(0, 20)

  const mapboxToken =
    process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
  const mapStyle =
    process.env.MAPBOX_STYLE ??
    process.env.NEXT_PUBLIC_MAPBOX_STYLE ??
    'mapbox://styles/mapbox/streets-v12'

  const serializedEvents = publicEvents.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    description: e.description,
    image: e.image,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    location: e.location,
    address: e.address,
    lat: e.lat ?? null,
    lng: e.lng ?? null,
    featured: e.featured,
    price: (e as any).price ?? null,
    avgRating: (e as any).avgRating ?? null,
    reviewCount: (e as any).reviewCount ?? 0,
    categories: (e as any).eventCategories?.map((ec: any) => ec.category) ?? [],
  })) as ExploreEvent[]

  return (
    <div className="bg-background pt-14">
      <JsonLd
        data={buildEventLandingJsonLd({
          name: 'Eventos en Loja',
          description: EVENTS_SEO_DESCRIPTION,
          path: 'eventos',
          events: upcomingEventsForSchema,
        })}
      />
      <JsonLd
        data={buildBreadcrumbListJsonLd([
          { name: 'Inicio', url: 'https://viveloja.com' },
          { name: 'Eventos en Loja' },
        ])}
      />
      <main>
        {/* Respuesta principal antes del mapa para que personas y buscadores entiendan la página de inmediato. */}
        <section className="section-shell space-y-3 py-10 sm:py-12">
          <span className="eyebrow text-primary">Agenda verificada</span>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Eventos en Loja
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            ¿Buscas qué hacer en Loja? Consulta una agenda actualizada de conciertos, eventos culturales, ferias, Artes Vivas, deportes y otros planes, con fechas, lugares, precios y enlaces cuando están disponibles.
          </p>
          <nav aria-label="Agendas temáticas de Loja" className="flex flex-wrap gap-2 pt-2">
            {[
              ['/conciertos-en-loja', 'Conciertos en Loja'],
              ['/eventos-culturales-loja', 'Eventos culturales'],
              ['/artes-vivas-loja', 'Artes Vivas'],
              ['/eventos-hoy-en-loja', 'Eventos hoy'],
              ['/eventos-este-fin-de-semana-en-loja', 'Este fin de semana'],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-accent"
              >
                {label}
              </Link>
            ))}
          </nav>
        </section>

        {/* Mapa: conserva la exploración visual después de la respuesta SEO principal. */}
        <div className="h-[60vh] w-full overflow-hidden sm:h-[70vh]">
          <ExploreClient
            initialVenues={[]}
            initialEvents={serializedEvents}
            categories={categories}
            mapboxToken={mapboxToken}
            mapStyle={mapStyle}
            mode="events"
          />
        </div>

        {/* Agenda y listados */}
        <div className="section-shell space-y-14 py-10 sm:space-y-16 sm:py-12">

        {/* Agenda por fecha */}
        <Agenda />

        {/* Destacados */}
        <ListingSection
          title="Destacados"
          icon={<Sparkles className="h-5 w-5" />}
          preTitle="Seleccion editorial"
          items={featuredEvents as EventListItem[]}
          type="events"
        />

        {/* Cerca de ti */}
        <NearYouSection type="events" mapboxToken={mapboxToken} />

        {/* Gratis */}
        <ListingSection
          title="Entrada libre"
          icon={<Ticket className="h-5 w-5" />}
          preTitle="Sin costo"
          items={freeEvents as EventListItem[]}
          type="events"
        />

        {/* Mejor reseñados */}
        <ListingSection
          title="Mejor reseñados"
          icon={<Star className="h-5 w-5" />}
          preTitle="Top valorados"
          items={topRatedEvents as EventListItem[]}
          type="events"
        />

        {/* Todos */}
        <ListingSection
          id="todos-los-eventos"
          title="Todos los eventos"
          icon={<LayoutGrid className="h-5 w-5" />}
          items={allEvents}
          type="events"
          enableLoadMore
          initialSkip={ALL_TAKE}
          take={ALL_TAKE}
          sort="recent"
        />

        {/* CTA */}
        <ListingCta type="events" />
      </div>
      </main>
    </div>
  )
}
