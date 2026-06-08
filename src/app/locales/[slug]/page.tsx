import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VenueDetail } from '@/components/features/venues'
import { Button } from '@/components/ui/button'
import { getVenueBySlug } from '@/lib/queries/venues'
import { getVenueMenu } from '@/lib/queries/features'
import { FavoriteButton } from '@/components/features/favorites/favorite-button'
import { incrementVenueViewAction } from '@/actions/views'

type VenueDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function VenueDetailPage({ params }: VenueDetailPageProps) {
  const { slug } = await params
  const [venue, session] = await Promise.all([
    getVenueBySlug(slug),
    getServerSession(authOptions),
  ])

  if (!venue) notFound()

  const [isFavorite, menu] = await Promise.all([
    session?.user?.id
      ? prisma.favorite.findUnique({
          where: { userId_venueId: { userId: session.user.id, venueId: venue.id } },
          select: { id: true },
        }).then(Boolean)
      : Promise.resolve(false),
    getVenueMenu(venue.id),
  ])

  incrementVenueViewAction(venue.id)

  return (
    <div className="pb-20 pt-10 sm:pt-14">
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
        <VenueDetail venue={venue} currentUserId={session?.user?.id} userRole={session?.user?.role} menu={menu} />
      </section>
    </div>
  )
}
