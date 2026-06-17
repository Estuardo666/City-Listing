'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, MapPin, Calendar, Sparkles, ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fadeInUp, staggerContainer } from '@/components/ui/motion'
import type { getPersonalizedHomeData } from '@/lib/queries/onboarding'

type PersonalizedData = Awaited<ReturnType<typeof getPersonalizedHomeData>>

interface HomePersonalizedSectionProps {
  data: PersonalizedData
  userName: string
}

export function HomePersonalizedSection({ data, userName }: HomePersonalizedSectionProps) {
  const { interests, followingVenues, relatedEvents, relatedVenues } = data
  const firstName = userName?.split(' ')[0] ?? 'Explorador'

  return (
    <section className="section-shell space-y-10">
      {/* Welcome banner */}
      <motion.div
        {...fadeInUp}
        className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent to-primary/5 px-6 py-8 sm:px-10"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              ¡Bienvenido, {firstName}!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu experiencia personalizada está lista. Explora lo que más te gusta.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Interest categories */}
      {interests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Tus intereses</h3>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex flex-wrap gap-2"
          >
            {interests.map((interest) => (
              <motion.div
                key={interest.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Link
                  href={`/explorar?category=${interest.category.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  {interest.category.icon && <span>{interest.category.icon}</span>}
                  {interest.category.name}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Following venues */}
      {followingVenues.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Locales que sigues</h3>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/dashboard/favoritos">
                Ver todos <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {followingVenues.slice(0, 4).map((fv) => (
              <Link
                key={fv.id}
                href={`/locales/${fv.venue.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  {fv.venue.image ? (
                    <img
                      src={fv.venue.image}
                      alt={fv.venue.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                      <MapPin className="h-8 w-8 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-foreground">{fv.venue.name}</p>
                  {fv.venue.avgRating != null && (
                    <div className="mt-1 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-muted-foreground">{fv.venue.avgRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related venues */}
      {relatedVenues.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Recomendados para ti</h3>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/explorar">
                Explorar <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {relatedVenues.slice(0, 8).map((venue) => (
              <Link
                key={venue.id}
                href={`/locales/${venue.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  {venue.image ? (
                    <img
                      src={venue.image}
                      alt={venue.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                      <MapPin className="h-8 w-8 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-foreground">{venue.name}</p>
                  {venue.venueCategories[0]?.category && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {venue.venueCategories[0].category.icon} {venue.venueCategories[0].category.name}
                    </p>
                  )}
                  {venue.avgRating != null && (
                    <div className="mt-1 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-muted-foreground">{venue.avgRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related events */}
      {relatedEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Eventos para ti</h3>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/eventos">
                Ver todos <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {relatedEvents.slice(0, 4).map((event) => (
              <Link
                key={event.id}
                href={`/eventos/${event.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Calendar className="h-6 w-6 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </p>
                  {event.eventCategories[0]?.category && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {event.eventCategories[0].category.icon} {event.eventCategories[0].category.name}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
