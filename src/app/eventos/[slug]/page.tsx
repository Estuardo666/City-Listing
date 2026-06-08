import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { EventDetail } from '@/components/features/events'
import { EventRelated } from '@/components/features/events/event-related'
import { getEventBySlug, getEvents } from '@/lib/queries/events'
import { getUserCollections } from '@/lib/queries/features'
import { FavoriteButton } from '@/components/features/favorites/favorite-button'
import { AddToCollectionButton } from '@/components/collections/add-to-collection-button'
import { incrementEventViewAction } from '@/actions/views'
import { JsonLd } from '@/components/json-ld'
import { buildEventJsonLd, buildBreadcrumbListJsonLd } from '@/lib/seo/json-ld-builders'

export const revalidate = 3600

type EventDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) {
    return { title: 'Evento no encontrado' }
  }

  const description = event.description.slice(0, 160)
  const canonical = `https://viveloja.com/eventos/${event.slug}`

  return {
    title: `${event.title} en Loja | Vive Loja`,
    description,
    openGraph: {
      title: event.title,
      description,
      url: canonical,
      siteName: 'ViveLoja',
      type: 'website',
      locale: 'es_EC',
      images: event.image ? [event.image] : [],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: event.title,
      description,
      images: event.image ? [event.image] : [],
    },
    alternates: {
      canonical,
    },
  }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params
  const [event, session] = await Promise.all([
    getEventBySlug(slug),
    getServerSession(authOptions),
  ])

  if (!event) notFound()

  const [relatedEvents, isFavorite, collections] = await Promise.all([
    getEvents(
      { status: 'APPROVED', category: event.eventCategories[0]?.category.slug },
      5
    ).then((list) => list.filter((e) => e.id !== event.id).slice(0, 4)),
    session?.user?.id
      ? prisma.favorite.findUnique({
          where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
          select: { id: true },
        }).then(Boolean)
      : Promise.resolve(false),
    session?.user?.id
      ? getUserCollections(session.user.id)
      : Promise.resolve([]),
  ])

  incrementEventViewAction(event.id)

  const categoryName = event.eventCategories[0]?.category?.name || 'Eventos'
  const categorySlug = event.eventCategories[0]?.category?.slug || 'eventos'

  const eventJsonLd = buildEventJsonLd({
    title: event.title,
    slug: event.slug,
    description: event.description,
    content: event.content,
    image: event.image,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    address: event.address,
    lat: event.lat,
    lng: event.lng,
    price: event.price,
    venue: event.venue
      ? {
          name: event.venue.name,
          slug: event.venue.slug,
          address: event.venue.address,
          lat: event.venue.lat,
          lng: event.venue.lng,
        }
      : null,
    user: { name: event.user.name },
    eventCategories: event.eventCategories,
    media: event.media,
  })

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Inicio', url: 'https://viveloja.com' },
    { name: 'Eventos', url: 'https://viveloja.com/eventos' },
    { name: categoryName, url: `https://viveloja.com/${categorySlug}` },
    { name: event.title },
  ])

  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <JsonLd data={eventJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <section className="section-shell space-y-8">
        {/* Nav bar */}
        <div className="flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            className="h-10 gap-2 rounded-xl border border-border/60 bg-card px-4 text-sm font-semibold text-foreground hover:bg-accent"
          >
            <Link href="/eventos">
              <ArrowLeft className="h-4 w-4" />
              Volver a eventos
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {session?.user?.id && collections.length > 0 && (
              <AddToCollectionButton
                collections={collections.map((c) => ({ id: c.id, name: c.name, icon: c.icon, _count: c._count }))}
                entityId={event.id}
                entityType="eventId"
              />
            )}
            <FavoriteButton eventId={event.id} initialIsFavorite={isFavorite} />
          </div>
        </div>

        {/* Main detail */}
        <EventDetail event={event} currentUserId={session?.user?.id} userRole={session?.user?.role} />

        {/* Related events */}
        <EventRelated events={relatedEvents} />
      </section>
    </div>
  )
}
