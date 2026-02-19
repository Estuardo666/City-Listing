'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays } from 'lucide-react'
import type { ExploreEvent } from '@/types/explore'

type HomeRelatedEventsProps = {
  events: ExploreEvent[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function HomeRelatedEvents({ events }: HomeRelatedEventsProps) {
  // Simple related logic: exclude featured, take next 4
  const related = events.filter((e) => !e.featured).slice(0, 4)
  if (related.length === 0) return null

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">🔥 También te puede gustar</p>
          <h2 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">Eventos relacionados</h2>
        </div>
        <Link
          href="/eventos"
          className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
        >
          Ver más <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
          >
            <Link
              href={`/eventos/${event.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-200 hover:border-primary/30 hover:bg-accent/40"
            >
              <div className="relative h-32 w-full overflow-hidden bg-accent">
                {event.image ? (
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">
                    {event.category.icon ?? '🎟️'}
                  </div>
                )}
                <span className="absolute left-2.5 top-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                  {event.category.icon ?? ''} {event.category.name}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3">
                <p className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{event.title}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3 shrink-0" />
                  {formatDate(event.startDate)}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="sm:hidden">
        <Link
          href="/eventos"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground"
        >
          Ver más eventos <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}
