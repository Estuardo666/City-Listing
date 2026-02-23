'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Star } from 'lucide-react'
import type { ExploreVenue } from '@/types/explore'

type HomeFeaturedVenuesProps = {
  venues: ExploreVenue[]
}

export function HomeFeaturedVenues({ venues }: HomeFeaturedVenuesProps) {
  const featured = venues.filter((v) => v.featured).slice(0, 6)
  const display = featured.length >= 3 ? featured : venues.slice(0, 6)
  if (display.length === 0) return null

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">⭐ Top picks</p>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Locales destacados</h2>
          <p className="text-sm text-muted-foreground sm:text-base">Los mejores lugares recomendados por la comunidad</p>
        </div>
        <Link
          href="/locales"
          className="hidden items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
        >
          Ver todos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {display.map((venue, i) => (
          <motion.div
            key={venue.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Link
              href={`/locales/${venue.slug}`}
              className="group flex gap-4 rounded-3xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:bg-accent/40 hover:shadow-lg"
            >
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-accent">
                {venue.image ? (
                  <Image
                    src={venue.image}
                    alt={venue.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="112px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl">
                    {venue.category.icon ?? '🏬'}
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col justify-center gap-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    Destacado
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground line-clamp-1">{venue.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {venue.description}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1">{venue.address ?? venue.location}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="sm:hidden">
        <Link
          href="/locales"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-foreground"
        >
          Ver todos los locales <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
