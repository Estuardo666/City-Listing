import Image from 'next/image'
import Link from 'next/link'
import { Globe, ImageIcon, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react'
import type { VenueListItem } from '@/types/venue'

type VenueCardProps = {
  venue: VenueListItem
}

export function VenueCard({ venue }: VenueCardProps) {
  return (
    <Link
      href={`/locales/${venue.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-emerald/30 active:scale-[0.99]"
    >
      {/* Image */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-accent">
        {venue.image ? (
          <Image
            src={venue.image}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-accent to-secondary">
            <ImageIcon className="h-10 w-10 text-muted-foreground/25" />
            <span className="text-xs text-muted-foreground/40">Sin imagen</span>
          </div>
        )}
        {venue.featured ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-coral px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            <Sparkles className="h-3 w-3" /> Destacado
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          {venue.category.icon ?? '🏬'} {venue.category.name}
        </span>

        <h3 className="mt-3 text-base font-semibold leading-snug text-foreground transition-colors duration-150 group-hover:text-emerald">
          {venue.name}
        </h3>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {venue.description}
        </p>

        <div className="mt-4 space-y-1.5 border-t border-border/50 pt-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-coral/70" />
            <span className="truncate">{venue.address ?? venue.location}</span>
          </p>
          {venue.phone ? (
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <span>{venue.phone}</span>
            </p>
          ) : null}
          {venue.website ? (
            <p className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="truncate">{venue.website}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald">
          <ShieldCheck className="h-3.5 w-3.5" />
          Verificado
        </div>
      </div>
    </Link>
  )
}
