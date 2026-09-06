'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { CategoryGradientBg } from '@/components/ui/category-gradient-bg'
import { GoogleVenuePhoto } from '@/components/features/venues/google-venue-photo'
import type { HomeItemDTO, ResolvedHomeSection } from '@/lib/queries/home-sections'

/**
 * Renders one configured home section on the website.
 *
 * It is the web twin of `HomeSectionView` on iOS: the component knows layouts,
 * not sections — the title, the filters and the order come from the admin, and
 * both surfaces read the same resolved payload.
 */

function ItemImage({ item, sizes }: { item: HomeItemDTO; sizes: string }) {
  const [failed, setFailed] = useState(false)
  if (item.imageUrl && !failed) {
    return (
      <Image
        src={item.imageUrl}
        alt={item.title}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        onError={() => setFailed(true)}
      />
    )
  }
  // Most imported venues have no image of their own; their photo comes from
  // Google, exactly like on the venue pages and in the app.
  return (
    <>
      <CategoryGradientBg
        name={item.title}
        showInitials
        className="h-full w-full"
        initialsClassName="text-3xl"
      />
      {item.kind === 'venue' && <GoogleVenuePhoto slug={item.slug} name={item.title} />}
    </>
  )
}

/** "★ 4,6 · Sant Jordi Club · sáb 12 sep" — only the parts that exist. */
function metaLine(item: HomeItemDTO) {
  const parts: string[] = []
  if (item.rating != null) parts.push(`★ ${item.rating.toFixed(1)}`)
  if (item.venueName ?? item.subtitle) parts.push((item.venueName ?? item.subtitle) as string)
  if (item.dateLabel) parts.push(item.dateLabel)
  return parts.length ? parts.join(' · ') : null
}

function ItemCard({ item, rank }: { item: HomeItemDTO; rank?: number }) {
  const meta = metaLine(item)
  return (
    <Link href={item.deeplink} className="group block w-64 shrink-0 space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-accent">
        <ItemImage item={item} sizes="256px" />
        {item.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
            {item.badge}
          </span>
        )}
        {rank !== undefined && (
          <span
            aria-hidden
            className="absolute bottom-0 left-2 text-7xl font-black leading-none text-white drop-shadow-lg"
          >
            {rank}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="line-clamp-2 text-sm font-medium text-foreground">{item.title}</p>
        {meta && <p className="line-clamp-1 text-xs text-muted-foreground">{meta}</p>}
        {item.priceLabel && <p className="text-sm font-semibold text-foreground">{item.priceLabel}</p>}
      </div>
    </Link>
  )
}

function ItemRow({ item }: { item: HomeItemDTO }) {
  return (
    <Link
      href={item.deeplink}
      className="group flex gap-4 rounded-2xl border border-border/50 bg-card p-4 transition-colors hover:bg-accent/40"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-accent">
        <ItemImage item={item} sizes="80px" />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="line-clamp-2 text-sm font-medium text-foreground">{item.title}</p>
        {item.subtitle && <p className="line-clamp-2 text-xs text-muted-foreground">{item.subtitle}</p>}
        {item.priceLabel && <p className="text-xs font-semibold text-foreground">{item.priceLabel}</p>}
      </div>
    </Link>
  )
}

function CategoryChip({ item }: { item: HomeItemDTO }) {
  return (
    <Link
      href={item.deeplink}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
    >
      {item.icon && <span aria-hidden>{item.icon}</span>}
      {item.title}
    </Link>
  )
}

export function HomeConfiguredSection({ section }: { section: ResolvedHomeSection }) {
  if (section.layout === 'hero') {
    return (
      <section className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent to-primary/5 px-6 py-10 sm:px-10 sm:py-14">
        <div className="space-y-4">
          <h2 className="max-w-2xl text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            {section.title}
          </h2>
          {(section.body ?? section.subtitle) && (
            <p className="max-w-xl text-base text-muted-foreground">{section.body ?? section.subtitle}</p>
          )}
          {section.actionLabel && section.deeplink && (
            <Link
              href={section.deeplink}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              {section.actionLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>
    )
  }

  if (!section.items.length) return null

  const header = (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-medium text-foreground sm:text-4xl">{section.title}</h2>
        {section.subtitle && <p className="text-sm text-muted-foreground sm:text-base">{section.subtitle}</p>}
      </div>
      {section.deeplink && (
        <Link
          href={section.deeplink}
          className="hidden items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
        >
          {section.actionLabel ?? 'Ver todo'} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )

  return (
    <section className="space-y-6">
      {header}
      {section.layout === 'chips' && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {section.items.map((item) => (
            <CategoryChip key={`${item.kind}:${item.id}`} item={item} />
          ))}
        </div>
      )}
      {section.layout === 'list' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {section.items.map((item) => (
            <ItemRow key={`${item.kind}:${item.id}`} item={item} />
          ))}
        </div>
      )}
      {section.layout === 'grid' && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {section.items.map((item) => (
            <div key={`${item.kind}:${item.id}`} className="w-full [&>a]:w-full">
              <ItemCard item={item} />
            </div>
          ))}
        </div>
      )}
      {(section.layout === 'carousel' || section.layout === 'ranked') && (
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2">
          {section.items.map((item, index) => (
            <div key={`${item.kind}:${item.id}`} className="snap-start">
              <ItemCard item={item} rank={section.layout === 'ranked' ? index + 1 : undefined} />
            </div>
          ))}
        </div>
      )}
      {section.deeplink && (
        <Link
          href={section.deeplink}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary sm:hidden"
        >
          {section.actionLabel ?? 'Ver todo'} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  )
}
