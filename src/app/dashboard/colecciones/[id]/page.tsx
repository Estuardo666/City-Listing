import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCollectionById } from '@/lib/queries/features'
import { VenueCard } from '@/components/features/venues/venue-card'
import { EventCard } from '@/components/features/events/event-card'
import { CollectionEditForm } from './collection-edit-form'
import { RemoveItemButton } from './remove-item-button'
import { ReorderButtons } from './reorder-buttons'
import { ArrowLeft, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  return { title: 'Colección — Vive Loja' }
}

export default async function CollectionDashboardDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const collection = await getCollectionById(id, session.user.id)
  if (!collection) notFound()

  const items = collection.items

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="h-10 gap-2 rounded-xl border border-border/60 bg-card px-4 text-sm font-semibold text-foreground hover:bg-accent">
            <Link href="/dashboard/colecciones">
              <ArrowLeft className="h-4 w-4" />
              Volver a colecciones
            </Link>
          </Button>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{collection.icon ?? '📁'}</span>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{collection.name}</h1>
              {collection.description && <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                {items.length} {items.length === 1 ? 'elemento' : 'elementos'} · {collection.isPublic ? 'Público' : 'Privado'}
              </p>
            </div>
          </div>
          <CollectionEditForm collection={collection} />
        </div>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Folder className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Colección vacía</p>
            <p className="mt-1 text-sm text-muted-foreground">Agrega elementos desde los locales o eventos</p>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item, index) => {
            const entityType = item.venue ? 'local' : item.event ? 'evento' : item.route ? 'ruta' : 'artículo'
            const entityName = item.venue?.name ?? item.event?.title ?? item.route?.title ?? item.post?.title ?? 'Elemento'

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 transition-colors hover:bg-accent/40"
              >
                {/* Reorder controls */}
                <div className="flex flex-col">
                  <ReorderButtons collectionId={collection.id} itemId={item.id} items={items.map((i) => ({ id: i.id, order: i.order }))} direction="up" />
                  <ReorderButtons collectionId={collection.id} itemId={item.id} items={items.map((i) => ({ id: i.id, order: i.order }))} direction="down" />
                </div>

                {/* Image */}
                {(item.venue?.image || item.event?.image || item.route?.image || item.post?.image) && (
                  <img
                    src={item.venue?.image ?? item.event?.image ?? item.route?.image ?? item.post?.image ?? ''}
                    alt={entityName}
                    className="h-14 w-14 rounded-lg object-cover shrink-0"
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{entityName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{entityType}</p>
                  {item.note && <p className="text-xs text-muted-foreground mt-0.5 italic">&quot;{item.note}&quot;</p>}
                </div>

                {/* Link */}
                {item.venue && (
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link href={`/locales/${item.venue.slug}`}>Ver</Link>
                  </Button>
                )}
                {item.event && (
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link href={`/eventos/${item.event.slug}`}>Ver</Link>
                  </Button>
                )}
                {item.route && (
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link href={`/rutas/${item.route.slug}`}>Ver</Link>
                  </Button>
                )}
                {item.post && (
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link href={`/blog/${item.post.slug}`}>Ver</Link>
                  </Button>
                )}

                {/* Remove */}
                <RemoveItemButton itemId={item.id} />
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
