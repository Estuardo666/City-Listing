import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { EventDetail } from '@/components/features/events'
import { EventRelated } from '@/components/features/events/event-related'
import { getEventBySlug, getEvents } from '@/lib/queries/events'
import { FavoriteButton } from '@/components/features/favorites/favorite-button'
import { incrementEventViewAction } from '@/actions/views'

type EventDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params
  const [event, session] = await Promise.all([
    getEventBySlug(slug),
    getServerSession(authOptions),
  ])

  if (!event) notFound()

  const relatedEvents = await getEvents(
    { status: 'APPROVED', category: event.category.slug },
    5
  ).then((list) => list.filter((e) => e.id !== event.id).slice(0, 4))

  const isFavorite = await (session?.user?.id
    ? prisma.favorite.findUnique({
        where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
        select: { id: true },
      }).then(Boolean)
    : Promise.resolve(false))

  incrementEventViewAction(event.id)

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
            <Link href="/eventos">
              <ArrowLeft className="h-4 w-4" />
              Volver a eventos
            </Link>
          </Button>
          <FavoriteButton eventId={event.id} initialIsFavorite={isFavorite} />
        </div>

        {/* Main detail */}
        <EventDetail event={event} currentUserId={session?.user?.id} userRole={session?.user?.role} />

        {/* Related events */}
        <EventRelated events={relatedEvents} />
      </section>
    </div>
  )
}
