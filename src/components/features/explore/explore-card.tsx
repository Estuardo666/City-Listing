'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CalendarDays, ImageIcon, MapPin, Phone, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExploreItem } from '@/types/explore'

type ExploreCardProps = {
  item: ExploreItem
  isActive: boolean
  onHover: (id: string | null) => void
  index: number
}

export function ExploreCard({ item, isActive, onHover, index }: ExploreCardProps) {
  const isVenue = item._type === 'venue'
  const href = isVenue ? `/locales/${item.slug}` : `/eventos/${item.slug}`
  const name = isVenue ? item.name : item.title
  const image = item.image
  const category = item.category
  const address = item.address ?? item.location

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      layout
      onHoverStart={() => onHover(item.id)}
      onHoverEnd={() => onHover(null)}
    >
      <Link
        href={href}
        className={cn(
          'group relative flex gap-3.5 overflow-hidden rounded-3xl border bg-card p-3.5 transition-all duration-200',
          isActive
            ? isVenue
              ? 'border-emerald/40 bg-emerald/5 shadow-sm'
              : 'border-coral/40 bg-coral/5 shadow-sm'
            : 'border-border/60 hover:border-border hover:shadow-sm'
        )}
      >
        {/* Image */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-accent sm:h-28 sm:w-28">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="112px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent to-secondary">
              <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
            </div>
          )}
          {/* Type badge on image */}
          <span
            className={cn(
              'absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white',
              isVenue ? 'bg-emerald' : 'bg-coral'
            )}
          >
            {isVenue ? 'Local' : 'Evento'}
          </span>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div className="space-y-1">
            {/* Category */}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              {category.icon ?? (isVenue ? '🏬' : '📍')}
              {category.name}
            </span>

            {/* Name */}
            <p
              className={cn(
                'truncate text-sm font-semibold leading-snug transition-colors',
                isActive
                  ? isVenue
                    ? 'text-emerald'
                    : 'text-coral'
                  : 'text-foreground group-hover:text-primary'
              )}
            >
              {name}
            </p>

            {/* Description */}
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {!isVenue && 'startDate' in item && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarDays className="h-3 w-3 text-coral/70" />
                {new Date(item.startDate).toLocaleDateString('es-EC', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}

            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/50" />
              <span className="truncate max-w-[140px]">{address}</span>
            </span>

            {isVenue && 'phone' in item && item.phone && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Phone className="h-3 w-3 text-muted-foreground/50" />
                {item.phone}
              </span>
            )}

            {item.featured && (
              <span className="ml-auto flex items-center gap-0.5 text-[10px] font-semibold text-coral">
                <Sparkles className="h-2.5 w-2.5" />
                Destacado
              </span>
            )}
          </div>
        </div>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="active-card-indicator"
            className={cn(
              'absolute left-0 top-0 h-full w-0.5 rounded-r-full',
              isVenue ? 'bg-emerald' : 'bg-coral'
            )}
          />
        )}
      </Link>
    </motion.div>
  )
}
