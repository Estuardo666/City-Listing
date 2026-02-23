'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ExploreVenue, ExploreEvent } from '@/types/explore'

type PromoItem = {
  id: string
  title: string
  slug: string
  image: string | null
  type: 'venue' | 'event'
  category: string
  categoryIcon: string | null
}

type HomePromoGridProps = {
  venues: ExploreVenue[]
  events: ExploreEvent[]
}

export function HomePromoGrid({ venues, events }: HomePromoGridProps) {
  const venueItems: PromoItem[] = venues
    .filter((v) => v.image)
    .slice(0, 4)
    .map((v) => ({
      id: v.id,
      title: v.name,
      slug: `/locales/${v.slug}`,
      image: v.image,
      type: 'venue',
      category: v.category.name,
      categoryIcon: v.category.icon,
    }))

  const eventItems: PromoItem[] = events
    .filter((e) => e.image)
    .slice(0, 4)
    .map((e) => ({
      id: e.id,
      title: e.title,
      slug: `/eventos/${e.slug}`,
      image: e.image,
      type: 'event',
      category: e.category.name,
      categoryIcon: e.category.icon,
    }))

  const items = [...venueItems, ...eventItems].slice(0, 6)
  if (items.length < 2) return null

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">📸 En tendencia</p>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Lo que está pasando ahora</h2>
          <p className="text-sm text-muted-foreground sm:text-base">Los lugares y eventos más populares del momento</p>
        </div>
        <Link
          href="/explorar"
          className="hidden items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
        >
          Explorar todo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Masonry-style grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
        {items.map((item, i) => {
          const isTall = i === 0 || i === 3
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={isTall ? 'row-span-2' : ''}
            >
              <Link
                href={item.slug}
                className={`group relative block w-full overflow-hidden rounded-3xl border border-border/60 bg-accent shadow-sm transition-all hover:shadow-xl ${
                  isTall ? 'h-80 md:h-full md:min-h-[360px]' : 'h-44 md:h-48'
                }`}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl">
                    {item.categoryIcon ?? (item.type === 'venue' ? '🏬' : '🎟️')}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                  <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    {item.categoryIcon ?? ''} {item.category}
                  </span>
                  <p className="text-sm font-bold text-white line-clamp-2 leading-snug">{item.title}</p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
