import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getUserProfileById } from '@/lib/queries/user-profile'
import { UserStatsCard } from '@/components/user/user-stats-card'
import { UserLevelBadge } from '@/components/user/user-level-badge'
import { StarRatingDisplay } from '@/components/review/star-rating'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Calendar, MapPin, Star } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUserProfileById(id)
  if (!user) return { title: 'Usuario no encontrado — Vive Loja' }
  return {
    title: `${user.name ?? 'Usuario'} — Vive Loja`,
    description: `Perfil de ${user.name ?? 'Usuario'} en Vive Loja. Nivel ${user.reviewerLevel} con ${user.totalReviews} reseñas.`,
  }
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUserProfileById(id)

  if (!user) notFound()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Perfil header */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-4xl">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? 'Usuario'}
                width={96}
                height={96}
                className="rounded-full object-cover"
              />
            ) : (
              <span>{user.name?.charAt(0).toUpperCase() ?? 'U'}</span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-medium text-foreground">
              {user.name ?? 'Usuario'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <UserLevelBadge
                reputationScore={user.reputationScore}
                reviewerLevel={user.reviewerLevel}
                size="md"
              />
              <span className="text-xs text-muted-foreground">
                Miembro desde {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats y badges */}
        <div className="mt-8">
          <UserStatsCard
            user={user}
            badges={user.badges}
          />
        </div>

        {/* Reseñas recientes */}
        {user.reviews.length > 0 && (
          <div className="mt-8 rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="text-lg font-medium text-foreground">
              <Star className="inline h-5 w-5 mr-2 text-amber-500" />
              Reseñas recientes ({user._count.reviews})
            </h2>
            <div className="mt-4 space-y-4">
              {user.reviews.map((review) => {
                const entity = review.venue ?? review.event
                if (!entity) return null
                const isVenue = !!review.venue
                const href = isVenue
                  ? `/locales/${entity.slug}`
                  : `/eventos/${entity.slug}`
                const entityName = isVenue ? review.venue!.name : review.event!.title

                return (
                  <Link
                    key={review.id}
                    href={href}
                    className="flex gap-4 rounded-xl border border-border/50 bg-background p-4 transition-colors hover:bg-accent/50"
                  >
                    {entity.image && (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={entity.image}
                          alt={entityName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {entityName}
                      </p>
                      <StarRatingDisplay rating={review.rating} size="sm" showCount={false} />
                      {review.title && (
                        <p className="text-sm font-medium text-foreground mt-1">
                          {review.title}
                        </p>
                      )}
                      {review.content && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {review.content}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Check-ins recientes */}
        {user.checkIns.length > 0 && (
          <div className="mt-8 rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="text-lg font-medium text-foreground">
              <MapPin className="inline h-5 w-5 mr-2 text-rose-500" />
              Check-ins recientes ({user._count.checkIns})
            </h2>
            <div className="mt-4 space-y-3">
              {user.checkIns.map((checkIn) => (
                <Link
                  key={checkIn.id}
                  href={`/locales/${checkIn.venue.slug}`}
                  className="flex items-center gap-4 rounded-xl border border-border/50 bg-background p-3 transition-colors hover:bg-accent/50"
                >
                  {checkIn.venue.image && (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={checkIn.venue.image}
                        alt={checkIn.venue.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {checkIn.venue.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(checkIn.createdAt)}
                    </p>
                    {checkIn.note && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {checkIn.note}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
