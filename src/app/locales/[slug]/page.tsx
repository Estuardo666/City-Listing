import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VenueDetail } from '@/components/features/venues'
import { Button } from '@/components/ui/button'
import { getVenueBySlug } from '@/lib/queries/venues'
import { getVenueMenu, getUserCollections } from '@/lib/queries/features'
import { getWatchEventsForVenue } from '@/lib/queries/watch-events'
import { FavoriteButton } from '@/components/features/favorites/favorite-button'
import { incrementVenueViewAction } from '@/actions/views'
import { JsonLd } from '@/components/json-ld'
import { buildLocalBusinessJsonLd, buildBreadcrumbListJsonLd } from '@/lib/seo/json-ld-builders'
import { VenueWatchEvents } from '@/components/features/watch-events/venue-watch-events'

export const revalidate = 3600

type VenueDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: VenueDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const venue = await getVenueBySlug(slug)

  if (!venue) {
    return { title: 'Local no encontrado' }
  }

  const category = venue.venueCategories[0]?.category?.name || 'Local'
  const cleanAddress = (venue.address || '')
    .replace(/,?\s*Loja\s*,?\s*Ecuador\s*$/i, '')
    .replace(/,?\s*Ecuador\s*$/i, '')
    .replace(/,?\s*Loja\s*$/i, '')
    .trim()
  const phonePart = venue.phone ? `, Teléfono ${venue.phone}` : ''
  const addressPart = cleanAddress ? ` lo encuentras en ${cleanAddress}` : ''
  const description = `${category} ${venue.name} en Loja,${addressPart}${phonePart}. Descubre más en Vive Loja.`
  const canonical = `https://viveloja.com/locales/${venue.slug}`

  return {
    title: `${venue.name} en Loja | Dirección y teléfono`,
    description,
    openGraph: {
      title: `${venue.name} en Loja`,
      description,
      url: canonical,
      siteName: 'ViveLoja',
      type: 'website',
      locale: 'es_EC',
      images: venue.image ? [venue.image] : [],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `${venue.name} en Loja`,
      description,
      images: venue.image ? [venue.image] : [],
    },
    alternates: {
      canonical,
    },
  }
}

export default async function VenueDetailPage({ params }: VenueDetailPageProps) {
  const { slug } = await params
  const [venue, session] = await Promise.all([
    getVenueBySlug(slug),
    getServerSession(authOptions),
  ])

  if (!venue) notFound()

  const [isFavorite, menu, collections, watchEvents] = await Promise.all([
    session?.user?.id
      ? prisma.favorite.findUnique({
          where: { userId_venueId: { userId: session.user.id, venueId: venue.id } },
          select: { id: true },
        }).then(Boolean)
      : Promise.resolve(false),
    getVenueMenu(venue.id),
    session?.user?.id
      ? getUserCollections(session.user.id)
      : Promise.resolve([]),
    getWatchEventsForVenue(venue.id),
  ])

  incrementVenueViewAction(venue.id)

  const categoryName = venue.venueCategories[0]?.category?.name || 'Locales'
  const categorySlug = venue.venueCategories[0]?.category?.slug || 'locales'

  const localBusinessJsonLd = buildLocalBusinessJsonLd({
    name: venue.name,
    slug: venue.slug,
    description: venue.description,
    phone: venue.phone,
    email: venue.email,
    website: venue.website,
    image: venue.image,
    logo: venue.logo,
    address: venue.address,
    location: venue.location,
    lat: venue.lat,
    lng: venue.lng,
    priceRange: venue.priceRange,
    avgRating: venue.avgRating,
    reviewCount: venue.reviewCount,
    venueCategories: venue.venueCategories,
    businessHours: venue.businessHours,
    services: venue.services,
  })

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Inicio', url: 'https://viveloja.com' },
    { name: 'Locales', url: 'https://viveloja.com/locales' },
    { name: categoryName, url: `https://viveloja.com/${categorySlug}` },
    { name: venue.name },
  ])

  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <JsonLd data={localBusinessJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <section className="section-shell space-y-8">
        {/* Nav bar */}
        <div className="flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            className="h-10 gap-2 rounded-xl border border-border/60 bg-card px-4 text-sm font-semibold text-foreground hover:bg-accent"
          >
            <Link href="/locales">
              <ArrowLeft className="h-4 w-4" />
              Volver a locales
            </Link>
          </Button>
          <FavoriteButton venueId={venue.id} initialIsFavorite={isFavorite} />
        </div>

        {/* Main detail */}
        <VenueDetail
          venue={venue}
          currentUserId={session?.user?.id}
          userRole={session?.user?.role}
          menu={menu}
          userCollections={collections.map((c) => ({ id: c.id, name: c.name, icon: c.icon, _count: c._count }))}
        />

        {/* Watch Events / Transmisiones */}
        {watchEvents.length > 0 && (
          <VenueWatchEvents
            events={watchEvents.map((wev) => ({
              id: wev.id,
              promotion: wev.promotion,
              hasBigScreen: wev.hasBigScreen,
              hasFreeEntry: wev.hasFreeEntry,
              watchEvent: {
                ...wev.watchEvent,
                performersList: wev.watchEvent.performersList,
              },
            }))}
          />
        )}
      </section>
    </div>
  )
}
