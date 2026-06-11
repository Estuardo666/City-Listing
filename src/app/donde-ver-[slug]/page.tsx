import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { JsonLd } from '@/components/json-ld'
import { buildSeoLandingJsonLd } from '@/lib/ai/seo'
import { buildBreadcrumbListJsonLd } from '@/lib/seo/json-ld-builders'
import { getWatchEventBySlug } from '@/lib/queries/watch-events'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Monitor, Gift, Phone, Star, Users, ArrowRight } from 'lucide-react'

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
  const title = `Dónde ver ${performersStr} en Loja`
  const description = `Descubre los mejores lugares para ver ${performersStr} en Loja. Promociones, reservas, pantallas gigantes y más.`

  return {
    title: `${title} | Vive Loja`,
    description,
    openGraph: {
      title,
      description,
      url: `https://viveloja.com/donde-ver-${event.slug}-en-loja`,
      siteName: 'ViveLoja',
      type: 'website',
      locale: 'es_EC',
      images: event.image ? [event.image] : [],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: event.image ? [event.image] : [],
    },
    alternates: {
      canonical: `https://viveloja.com/donde-ver-${event.slug}-en-loja`,
    },
  }
}

export default async function DondeVerPage({ params }: PageProps) {
  const { slug } = await params
  const event = await getWatchEventBySlug(slug)

  if (!event) notFound()

  const performers = event.performersList.map((p) => p.performer.name)
  const performersStr = performers.join(' vs ')
  const matchDate = new Date(event.matchDate)

  const { event: eventJsonLd, itemList } = buildSeoLandingJsonLd(
    {
      name: event.name,
      slug: event.slug,
      type: event.type,
      description: event.description,
      matchDate: event.matchDate,
      matchTime: event.matchTime,
      competition: event.competition,
      image: event.image,
      performers,
    },
    event.venues.map((v) => ({
      name: v.venue.name,
      slug: v.venue.slug,
      description: v.venue.description,
      address: v.venue.address,
      lat: v.venue.lat,
      lng: v.venue.lng,
      avgRating: v.venue.avgRating,
      reviewCount: v.venue.reviewCount,
      phone: v.venue.phone,
      image: v.venue.image,
    })),
  )

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Inicio', url: 'https://viveloja.com' },
    { name: 'Dónde ver', url: 'https://viveloja.com/partidos' },
    { name: `Dónde ver ${performersStr} en Loja` },
  ])

  const faqs = [
    {
      q: `¿Dónde puedo ver ${performersStr} en Loja?`,
      a: `Puedes ver ${performersStr} en ${event.venues.length} ${event.venues.length === 1 ? 'lugar' : 'lugares'} en Loja. Revisa la lista completa arriba para elegir tu favorito.`,
    },
    {
      q: `¿A qué hora es ${performersStr}?`,
      a: event.matchTime
        ? `El evento es el ${matchDate.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${event.matchTime}.`
        : `El evento es el ${matchDate.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}.`,
    },
    {
      q: `¿Hay promociones para ver ${performersStr}?`,
      a: `Sí, varios negocios ofrecen promociones especiales como 2x1 en bebidas, pantallas gigantes y entrada gratuita. Consulta cada local para más detalles.`,
    },
  ]

  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <JsonLd data={eventJsonLd} />
      <JsonLd data={itemList} />
      <JsonLd data={breadcrumbJsonLd} />

      <section className="section-shell space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="text-sm">
            {event.competition || 'Evento en vivo'}
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Dónde ver {performersStr} en Loja
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {event.venues.length} {event.venues.length === 1 ? 'lugar' : 'lugares'} para ver {performersStr} en Loja.
            Promociones, pantallas gigantes y reservas disponibles.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {matchDate.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            {event.matchTime && (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {event.matchTime}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {event.venues.length} lugares
            </span>
          </div>
        </div>

        {/* Venues */}
        {event.venues.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {event.venues.map((ev, index) => (
              <Card key={ev.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {ev.venue.image && (
                  <div className="relative">
                    <img src={ev.venue.image} alt={ev.venue.name} className="w-full h-40 object-cover" />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-primary text-primary-foreground">#{index + 1}</Badge>
                    </div>
                  </div>
                )}
                <CardContent className="p-5 space-y-3">
                  <div>
                    <Link href={`/locales/${ev.venue.slug}`} className="text-lg font-semibold hover:text-primary transition-colors">
                      {ev.venue.name}
                    </Link>
                    {ev.venue.avgRating !== null && ev.venue.reviewCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {ev.venue.avgRating.toFixed(1)} ({ev.venue.reviewCount} reseñas)
                      </div>
                    )}
                  </div>

                  {ev.venue.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
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
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary font-medium">
                      🎁 {ev.promotion}
                    </div>
                  )}

                  {ev.venue.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{ev.venue.description}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/locales/${ev.venue.slug}`}>
                        Ver detalles <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
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
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Aún no hay negocios asociados a este evento.</p>
              <Button asChild className="mt-4" size="sm">
                <Link href={`/partidos/${event.slug}`}>Ver evento</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* FAQs */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3 bg-muted/30 rounded-2xl p-8">
          <h2 className="text-lg font-semibold">¿Tienes un negocio y transmites este evento?</h2>
          <p className="text-sm text-muted-foreground">
            Agrega tu negocio a Vive Loja y aparece en esta página.
          </p>
          <Button asChild>
            <Link href="/locales/crear">Registrar mi negocio</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
