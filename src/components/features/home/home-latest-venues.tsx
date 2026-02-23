'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin } from 'lucide-react'
import type { ExploreVenue } from '@/types/explore'

type HomeLatestVenuesProps = {
  venues: ExploreVenue[]
}

export function HomeLatestVenues({ venues }: HomeLatestVenuesProps) {
  const display = venues.slice(0, 8)
  if (display.length === 0) return null

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">🆕 Recién llegados</p>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Últimos locales agregados</h2>
          <p className="text-sm text-muted-foreground sm:text-base">Descubre los nuevos lugares que se han unido a Loja</p>
        </div>
        <Link
          href="/locales"
          className="hidden items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
        >
          Ver todos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="-mx-6 overflow-x-auto px-6 pb-2 sm:mx-0 sm:px-0 sm:pb-0">
        <div className="flex gap-4 sm:grid sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {display.map((venue, i) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="w-56 shrink-0 sm:w-auto"
            >
              <Link
                href={`/locales/${venue.slug}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="relative h-40 w-full overflow-hidden bg-accent">
                  {venue.image ? (
                    <Image
                      src={venue.image}
                      alt={venue.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 224px, (max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl">
                      {venue.category.icon ?? '🏬'}
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    {venue.category.icon ?? ''} {venue.category.name}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{venue.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{venue.address ?? venue.location}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
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
