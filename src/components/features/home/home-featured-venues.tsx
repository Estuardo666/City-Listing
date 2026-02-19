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
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">⭐ Top picks</p>
          <h2 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">Locales destacados</h2>
        </div>
        <Link
          href="/locales"
          className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
        >
          Ver todos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {display.map((venue, i) => (
          <motion.div
            key={venue.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
          >
            <Link
              href={`/locales/${venue.slug}`}
              className="group flex gap-4 rounded-2xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:bg-accent/40"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-accent">
                {venue.image ? (
                  <Image
                    src={venue.image}
                    alt={venue.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">
                    {venue.category.icon ?? '🏬'}
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col justify-center gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    Destacado
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground line-clamp-1">{venue.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {venue.description}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
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
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground"
        >
          Ver todos los locales <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}
