import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarDays, MapPin, Settings2, Star } from 'lucide-react'
import { GoogleVenuePhoto } from '@/components/features/venues/google-venue-photo'
import { DiscoveryIcon } from '@/components/onboarding/discovery-icon'
import { Button } from '@/components/ui/button'
import { LIFESTYLE_OPTIONS } from '@/lib/constants/onboarding'
import type { getPersonalizedHomeData } from '@/lib/queries/onboarding'

type PersonalizedData = Awaited<ReturnType<typeof getPersonalizedHomeData>>

export function HomePersonalizedSection({ data, userName }: { data: PersonalizedData; userName: string }) {
  const { interests, preferences, followingVenues, relatedEvents, relatedVenues } = data
  const firstName = userName?.split(' ')[0] ?? ''
  const preferenceLabels = LIFESTYLE_OPTIONS
    .filter((option) => preferences.some(({ preference }) => preference === option.id))
    .map((option) => option.label)
  const hasSignals = interests.length > 0 || preferenceLabels.length > 0 || followingVenues.length > 0

  if (!hasSignals) return null

  return (
    <section className="space-y-8" aria-labelledby="personalized-home-title">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-primary">Tu cartelera</p>
          <h2 id="personalized-home-title" className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {firstName ? `Para ti, ${firstName}` : 'Elegido para ti'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Priorizamos coincidencias con tus temas, tu forma de disfrutar la ciudad y los lugares que sigues.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="min-h-11 shrink-0 self-start rounded-xl sm:self-auto">
          <Link href="/dashboard/intereses">
            <Settings2 className="mr-2 h-4 w-4" />
            Ajustar preferencias
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Señales usadas para personalizar el inicio">
        {interests.slice(0, 5).map((interest) => (
          <Link key={interest.id} href={`/explorar?category=${interest.category.slug}`} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground transition-[transform,border-color] duration-150 active:scale-[0.97] hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <DiscoveryIcon category={interest.category} className="h-3.5 w-3.5 text-primary" />
            {interest.category.name}
          </Link>
        ))}
        {preferenceLabels.slice(0, 3).map((label) => (
          <span key={label} className="inline-flex min-h-9 items-center rounded-full bg-secondary px-3 text-xs font-medium text-secondary-foreground">{label}</span>
        ))}
      </div>

      {relatedEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-foreground">Próximos planes para ti</h3>
            <Link href="/eventos" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Ver eventos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedEvents.slice(0, 4).map((event) => (
              <Link key={event.id} href={`/eventos/${event.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card transition-[transform,border-color] duration-200 active:scale-[0.98] hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                  {event.image ? <Image src={event.image} alt={event.title} fill unoptimized sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-200 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center"><CalendarDays className="h-7 w-7 text-muted-foreground" /></div>}
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">{new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' }).format(event.startDate)}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground">{event.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {relatedVenues.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-foreground">Lugares que encajan contigo</h3>
            <Link href="/explorar" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Explorar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {relatedVenues.slice(0, 4).map((venue) => (
              <Link key={venue.id} href={`/locales/${venue.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card transition-[transform,border-color] duration-200 active:scale-[0.98] hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                  {venue.image ? <Image src={venue.image} alt={venue.name} fill unoptimized sizes="(min-width: 640px) 25vw, 50vw" className="object-cover transition-transform duration-200 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center"><MapPin className="h-7 w-7 text-muted-foreground" /></div>}
                  {!venue.image && <GoogleVenuePhoto slug={venue.slug} name={venue.name} />}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-foreground">{venue.name}</p>
                  {venue.avgRating != null && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3 w-3 fill-current" /> {venue.avgRating.toFixed(1)}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
