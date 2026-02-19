import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VenueDetail } from '@/components/features/venues'
import { Button } from '@/components/ui/button'
import { getVenueBySlug } from '@/lib/queries/venues'
import { FavoriteButton } from '@/components/features/favorites/favorite-button'
import { CommentSection } from '@/components/features/comments/comment-section'
import type { CommentWithUser } from '@/actions/comments'

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

  const prismaAny = prisma as unknown as {
    comment: {
      findMany: (args: unknown) => Promise<CommentWithUser[]>
    }
  }

  const [isFavorite, comments] = await Promise.all([
    session?.user?.id
      ? prisma.favorite.findUnique({
          where: { userId_venueId: { userId: session.user.id, venueId: venue.id } },
          select: { id: true },
        }).then(Boolean)
      : Promise.resolve(false),
    prismaAny.comment.findMany({
      where: { venueId: venue.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, content: true, parentId: true, createdAt: true,
        user: { select: { id: true, name: true, image: true } },
      },
    }),
  ])

  return (
    <div className="pb-16 pt-10 sm:pt-14">
      <section className="section-shell space-y-6">
        <div className="flex items-center justify-between">
          <Button
            asChild
            className="h-10 border border-border/80 bg-background/75 px-4 text-sm text-foreground hover:bg-accent"
          >
            <Link href="/locales">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a locales
            </Link>
          </Button>
          <FavoriteButton venueId={venue.id} initialIsFavorite={isFavorite} />
        </div>

        <VenueDetail venue={venue} />

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <CommentSection
            initialComments={comments}
            venueId={venue.id}
          />
        </div>
      </section>
    </div>
  )
}
