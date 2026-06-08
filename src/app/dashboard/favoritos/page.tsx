import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserFavorites } from '@/lib/queries/trending'
import { VenueCard } from '@/components/features/venues/venue-card'
import { EventCard } from '@/components/features/events/event-card'
import { BlogCard } from '@/components/features/blog/blog-card'
import { RouteCard } from '@/components/route/route-card'
import { Heart } from 'lucide-react'

export const metadata = { title: 'Mis Favoritos — Vive Loja' }

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const favorites = await getUserFavorites(session.user.id)

  const venueFavorites = favorites.filter((f) => f.venueId && f.venue)
  const eventFavorites = favorites.filter((f) => f.eventId && f.event)
  const postFavorites = favorites.filter((f) => f.postId && f.post)
  const routeFavorites = favorites.filter((f) => f.routeId && f.route)

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dashboard</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500" /> Mis Favoritos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {favorites.length} {favorites.length === 1 ? 'elemento guardado' : 'elementos guardados'}
          </p>
        </div>

        {favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">No tienes favoritos</p>
            <p className="mt-1 text-sm text-muted-foreground">Guarda locales, eventos y artículos que te gusten</p>
          </div>
        )}

        {venueFavorites.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Locales ({venueFavorites.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {venueFavorites.map((f) => (
                <VenueCard key={f.id} venue={f.venue!} />
              ))}
            </div>
          </div>
        )}

        {eventFavorites.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Eventos ({eventFavorites.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {eventFavorites.map((f) => (
                <EventCard key={f.id} event={f.event!} />
              ))}
            </div>
          </div>
        )}

        {postFavorites.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Artículos ({postFavorites.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {postFavorites.map((f) => (
                <BlogCard key={f.id} post={f.post! as any} />
              ))}
            </div>
          </div>
        )}

        {routeFavorites.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Rutas ({routeFavorites.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {routeFavorites.map((f) => (
                <RouteCard key={f.id} route={f.route! as any} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
