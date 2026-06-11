import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { JsonLd } from '@/components/json-ld'
import { buildWatchEventJsonLd } from '@/lib/ai/seo'
import { buildBreadcrumbListJsonLd } from '@/lib/seo/json-ld-builders'
import { getWatchEventBySlug } from '@/lib/queries/watch-events'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Monitor, Gift, Phone, Star, Users, ArrowLeft } from 'lucide-react'

export const revalidate = 3600

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await getWatchEventBySlug(slug)

  if (!event) return { title: 'Evento no encontrado' }

  const performers = event.performersList.map((p) => p.performer.name)
  const performersStr = performers.join(' vs ')
  const description = `Dónde ver ${performersStr} en Loja. Descubre los mejores negocios, promociones y reservas.`

  return {
    title: `${performersStr} en Loja | Vive Loja`,
    description,
    openGraph: {
      title: `${performersStr} en Loja`,
      description,
      url: `https://viveloja.com/partidos/${event.slug}`,
      siteName: 'ViveLoja',
      type: 'website',
      locale: 'es_EC',
      images: event.image ? [event.image] : [],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `${performersStr} en Loja`,
      description,
      images: event.image ? [event.image] : [],
    },
    alternates: {
      canonical: `https://viveloja.com/partidos/${event.slug}`,
    },
  }
}

const TYPE_LABELS: Record<string, string> = {
  SPORTS: 'Deporte',
  CONCERT: 'Concierto',
  THEATER: 'Teatro',
  ESPORTS: 'eSports',
  OTHER: 'Evento',
}

export default async function WatchEventDetailPage({ params }: PageProps) {
  const { slug } = await params
  const event = await getWatchEventBySlug(slug)

  if (!event) notFound()

  const performers = event.performersList.map((p) => p.performer.name)
  const performersStr = performers.join(' vs ')
  const matchDate = new Date(event.matchDate)

  const watchEventJsonLd = buildWatchEventJsonLd({
    name: event.name,
    slug: event.slug,
    type: event.type,
    description: event.description,
    matchDate: event.matchDate,
    matchTime: event.matchTime,
    competition: event.competition,
    image: event.image,
    performers,
    venues: event.venues.map((v) => ({
      name: v.venue.name,
      slug: v.venue.slug,
      address: v.venue.address,
      lat: v.venue.lat,
      lng: v.venue.lng,
    })),
  })

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Inicio', url: 'https://viveloja.com' },
    { name: 'Partidos', url: 'https://viveloja.com/partidos' },
    { name: performersStr },
  ])

  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <JsonLd data={watchEventJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <section className="section-shell space-y-8">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="h-10 gap-2 rounded-xl border border-border/60 bg-card px-4 text-sm font-semibold text-foreground hover:bg-accent">
            <Link href="/partidos">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/20 border border-border/50">
          {event.image && (
            <img src={event.image} alt={event.name} className="w-full h-48 sm:h-64 object-cover" />
          )}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{TYPE_LABELS[event.type] || event.type}</Badge>
              {event.competition && <Badge variant="outline">{event.competition}</Badge>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{performersStr}</h1>
            {event.description && (
              <p className="text-muted-foreground max-w-2xl">{event.description}</p>
            )}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {matchDate.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {event.matchTime && (
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {event.matchTime}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {event.venues.length} {event.venues.length === 1 ? 'lugar' : 'lugares'}
              </span>
            </div>
          </div>
        </div>

        {/* Venues Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4">¿Dónde ver este evento?</h2>
          {event.venues.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Aún no hay negocios asociados a este evento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {event.venues.map((ev) => (
                <Card key={ev.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  {ev.venue.image && (
                    <img src={ev.venue.image} alt={ev.venue.name} className="w-full h-36 object-cover" />
                  )}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <Link href={`/locales/${ev.venue.slug}`} className="font-semibold hover:text-primary transition-colors">
                        {ev.venue.name}
                      </Link>
                      {ev.venue.avgRating !== null && ev.venue.reviewCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {ev.venue.avgRating.toFixed(1)} ({ev.venue.reviewCount})
                        </div>
                      )}
                    </div>

                    {ev.venue.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {ev.venue.address}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {ev.hasBigScreen && (
                        <Badge variant="secondary" className="text-xs">
                          <Monitor className="h-3 w-3 mr-1" /> Pantalla gigante
                        </Badge>
                      )}
                      {ev.hasFreeEntry && (
                        <Badge variant="secondary" className="text-xs">
                          <Gift className="h-3 w-3 mr-1" /> Entrada gratuita
                        </Badge>
                      )}
                    </div>

                    {ev.promotion && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 text-xs text-primary font-medium">
                        🎁 {ev.promotion}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/locales/${ev.venue.slug}`}>Ver local</Link>
                      </Button>
                      {ev.venue.phone && (
                        <Button asChild size="sm" variant="outline">
                          <a href={`https://wa.me/${ev.venue.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                            <Phone className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Map placeholder */}
        {event.venues.some((v) => v.venue.lat && v.venue.lng) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mapa de negocios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-xl h-64 flex items-center justify-center text-muted-foreground text-sm">
                <MapPin className="h-5 w-5 mr-2" />
                Mapa interactivo — {event.venues.filter((v) => v.venue.lat && v.venue.lng).length} negocios con ubicación
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
