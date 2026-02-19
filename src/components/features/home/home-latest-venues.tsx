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
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">🆕 Recién llegados</p>
          <h2 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">Últimos locales agregados</h2>
        </div>
        <Link
          href="/locales"
          className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
        >
          Ver todos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0">
        <div className="flex gap-4 sm:grid sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {display.map((venue, i) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="w-52 shrink-0 sm:w-auto"
            >
              <Link
                href={`/locales/${venue.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-200 hover:border-primary/30 hover:brightness-95 dark:hover:brightness-110"
              >
                <div className="relative h-36 w-full overflow-hidden bg-accent">
                  {venue.image ? (
                    <Image
                      src={venue.image}
                      alt={venue.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 208px, (max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">
                      {venue.category.icon ?? '🏬'}
                    </div>
                  )}
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                    {venue.category.icon ?? ''} {venue.category.name}
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-3">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{venue.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
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
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground"
        >
          Ver todos los locales <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}
