import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCollectionBySlug } from '@/lib/queries/features'
import { VenueCard } from '@/components/features/venues/venue-card'
import { EventCard } from '@/components/features/events/event-card'
import { Folder, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return { title: `Colección — Vive Loja` }
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const collection = await getCollectionBySlug(slug)

  if (!collection) notFound()

  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <section className="section-shell space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{collection.icon ?? '📁'}</span>
            <div>
              <h1 className="text-2xl font-medium sm:text-3xl">{collection.name}</h1>
              {collection.description && <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={collection.user.image ?? undefined} />
              <AvatarFallback className="text-[10px]">{collection.user.name?.charAt(0) ?? '?'}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">Por {collection.user.name ?? 'Anónimo'}</span>
            <span className="text-xs text-muted-foreground">· {collection.items.length} {collection.items.length === 1 ? 'elemento' : 'elementos'}</span>
          </div>
        </div>

        {collection.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Folder className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Colección vacía</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collection.items.map((item) => {
            if (item.venue) return <VenueCard key={item.id} venue={item.venue} />
            if (item.event) return <EventCard key={item.id} event={item.event} />
            return null
          })}
        </div>
      </section>
    </div>
  )
}
