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
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">📸 En tendencia</p>
          <h2 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">Lo que está pasando ahora</h2>
        </div>
        <Link
          href="/explorar"
          className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
        >
          Explorar todo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Masonry-style grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {items.map((item, i) => {
          const isTall = i === 0 || i === 3
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className={isTall ? 'row-span-2' : ''}
            >
              <Link
                href={item.slug}
                className={`group relative block w-full overflow-hidden rounded-2xl border border-border/60 bg-accent shadow-sm transition-all hover:shadow-lg ${
                  isTall ? 'h-72 md:h-full md:min-h-[320px]' : 'h-40 md:h-44'
                }`}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl">
                    {item.categoryIcon ?? (item.type === 'venue' ? '🏬' : '🎟️')}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-0.5">
                  <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
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
