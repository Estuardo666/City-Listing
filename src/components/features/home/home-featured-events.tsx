'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import type { ExploreEvent } from '@/types/explore'

type HomeFeaturedEventsProps = {
  events: ExploreEvent[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function EventHeroCard({ event }: { event: ExploreEvent }) {
  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="group relative flex h-full min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl bg-card transition-all duration-300 hover:scale-[1.01]"
    >
      {event.image ? (
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 40vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10 text-7xl">
          🎭
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="relative z-10 space-y-2 p-5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md">
          {event.category.icon ?? '🎟️'} {event.category.name}
        </span>
        <h3 className="text-2xl font-bold leading-tight text-white sm:text-3xl line-clamp-2">{event.title}</h3>
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/75">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatDate(event.startDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {event.location}
          </span>
        </div>
      </div>
    </Link>
  )
}

function EventMediumCard({ event }: { event: ExploreEvent }) {
  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="group relative flex h-full min-h-[160px] flex-col justify-end overflow-hidden rounded-2xl bg-card transition-all duration-300 hover:scale-[1.01]"
    >
      {event.image ? (
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 30vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent text-5xl">
          {event.category.icon ?? '�️'}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="relative z-10 space-y-1 p-4">
        <span className="text-xs font-bold uppercase tracking-widest text-white/60">
          {event.category.name}
        </span>
        <p className="text-base font-bold leading-snug text-white line-clamp-2">{event.title}</p>
        <div className="flex items-center gap-1 text-sm text-white/65">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(event.startDate)}
        </div>
      </div>
    </Link>
  )
}

export function HomeFeaturedEvents({ events }: HomeFeaturedEventsProps) {
  const featured = events.filter((e) => e.featured).slice(0, 5)
  const display = featured.length >= 3 ? featured : events.slice(0, 5)
  if (display.length === 0) return null

  const [main, second, third, fourth, fifth] = display

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">🎉 Imperdibles</p>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Eventos destacados</h2>
          <p className="text-sm text-muted-foreground sm:text-base">No te pierdas los eventos más importantes de Loja</p>
        </div>
        <Link
          href="/eventos"
          className="hidden items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
        >
          Ver todos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* ── Desktop bento grid (md+) ── */}
      <div className="hidden md:grid md:grid-cols-3 md:grid-rows-2 md:gap-4" style={{ height: '600px' }}>
        {/* Hero: col 1, row 1-2 */}
        {main && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="row-span-2 h-full"
          >
            <EventHeroCard event={main} />
          </motion.div>
        )}
        {/* Col 2-3, row 1 */}
        {second && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="h-full"
          >
            <EventMediumCard event={second} />
          </motion.div>
        )}
        {third && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="h-full"
          >
            <EventMediumCard event={third} />
          </motion.div>
        )}
        {/* Col 2-3, row 2 */}
        {fourth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="h-full"
          >
            <EventMediumCard event={fourth} />
          </motion.div>
        )}
        {fifth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="h-full"
          >
            <EventMediumCard event={fifth} />
          </motion.div>
        )}
      </div>

      {/* ── Mobile stack ── */}
      <div className="flex flex-col gap-4 md:hidden">
        {main && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <EventHeroCard event={main} />
          </motion.div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {display.slice(1, 5).map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <EventMediumCard event={event} />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="sm:hidden">
        <Link
          href="/eventos"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-foreground"
        >
          Ver todos los eventos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
