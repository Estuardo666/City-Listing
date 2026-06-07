import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVenueOwnerAnalytics } from '@/lib/queries/features'
import { StarRatingDisplay } from '@/components/review/star-rating'
import { Eye, Heart, MessageCircle, Calendar, Star, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const metadata = { title: 'Analytics — Vive Loja' }

export default async function VenueAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const venue = await prisma.venue.findFirst({
    where: { slug, userId: session.user.id },
    select: { id: true, name: true },
  })
  if (!venue) redirect('/dashboard/locales')

  const analytics = await getVenueOwnerAnalytics(session.user.id)
  const venueData = analytics.venues.find((v) => v.id === venue.id)

  if (!venueData) redirect('/dashboard/locales')

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{venue.name}</p>
          <h1 className="text-2xl font-semibold text-foreground">Estadísticas</h1>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-xs font-medium">Visitas</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{venueData.viewCount}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="h-4 w-4" />
              <span className="text-xs font-medium">Rating</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{venueData.avgRating?.toFixed(1) ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{venueData.reviewCount} reseñas</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span className="text-xs font-medium">Favoritos</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{venueData._count.favorites}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Reservas</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{venueData._count.reservations}</p>
          </div>
        </div>

        {/* Rating distribution */}
        {analytics.ratingDistribution.length > 0 && (
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Distribución de ratings</h2>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const entry = analytics.ratingDistribution.find((r) => r.rating === rating)
                const count = entry?.count ?? 0
                const total = analytics.ratingDistribution.reduce((sum, r) => sum + r.count, 0)
                const pct = total > 0 ? (count / total) * 100 : 0
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-4 text-right">{rating}</span>
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent reviews */}
        {analytics.recentReviews.length > 0 && (
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Últimas reseñas</h2>
            <div className="space-y-3">
              {analytics.recentReviews.filter((r) => r.venueId === venue.id).map((review) => (
                <div key={review.id} className="flex gap-3 p-3 rounded-lg border">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={review.user.image ?? undefined} />
                    <AvatarFallback className="text-[10px]">{review.user.name?.charAt(0) ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{review.user.name ?? 'Anónimo'}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(review.createdAt)}</span>
                    </div>
                    <StarRatingDisplay rating={review.rating} showCount={false} size="sm" />
                    {review.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{review.content}</p>}
                    {review.ownerReply && (
                      <div className="mt-2 p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-400">
                        <span className="font-semibold">Tu respuesta:</span> {review.ownerReply}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
