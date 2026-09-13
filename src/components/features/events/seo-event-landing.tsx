import Link from 'next/link'
import { ArrowRight, CalendarDays, ExternalLink, MapPin } from 'lucide-react'
import type { EventLandingConfig } from '@/lib/seo/event-landings'
import { SITE_URL } from '@/lib/seo/event-landings'
import { EventGrid } from '@/components/features/events/event-grid'
import { JsonLd } from '@/components/json-ld'
import {
  buildBreadcrumbListJsonLd,
  buildEventLandingJsonLd,
} from '@/lib/seo/json-ld-builders'
import type { EventListItem } from '@/types/event'

type SeoEventLandingProps = {
  config: EventLandingConfig
  events: EventListItem[]
}

const relatedPages = [
  { href: '/eventos', label: 'Todos los eventos en Loja' },
  { href: '/conciertos-en-loja', label: 'Conciertos en Loja' },
  { href: '/eventos-culturales-loja', label: 'Eventos culturales' },
  { href: '/artes-vivas-loja', label: 'Artes Vivas en Loja' },
  { href: '/eventos-este-fin-de-semana-en-loja', label: 'Eventos este fin de semana' },
]

export function SeoEventLanding({ config, events }: SeoEventLandingProps) {
  const collectionJsonLd = buildEventLandingJsonLd({
    name: config.title,
    description: config.description,
    path: config.path,
    events,
  })
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Inicio', url: SITE_URL },
    { name: 'Eventos', url: `${SITE_URL}/eventos` },
    { name: config.title },
  ])

  return (
    <div className="min-h-screen bg-background pb-20 pt-10 sm:pt-14">
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <main className="section-shell space-y-12 sm:space-y-16">
        <header className="max-w-3xl space-y-5">
          <p className="eyebrow text-primary">{config.eyebrow}</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            {config.title}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {config.intro}
          </p>
          {config.officialUrl && config.officialLabel && (
            <a
              href={config.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              {config.officialLabel}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </header>

        <nav
          aria-label="Secciones de eventos en Loja"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {relatedPages
            .filter((page) => page.href !== `/${config.path}`)
            .slice(0, 4)
            .map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="group flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-accent"
              >
                {page.label}
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
        </nav>

        <section aria-labelledby="eventos-seccion" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                <CalendarDays className="h-4 w-4 text-primary" />
                Agenda actualizada
              </p>
              <h2 id="eventos-seccion" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {config.sectionTitle}
              </h2>
            </div>
            <Link
              href="/eventos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Ver agenda completa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {events.length > 0 ? (
            <EventGrid events={events} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/60 p-8 text-center">
              <MapPin className="mx-auto h-8 w-8 text-primary/70" />
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {config.emptyMessage}
              </p>
              <Link
                href="/eventos"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Explorar eventos en Loja <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        <section className="grid gap-8 border-t border-border/60 pt-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Una agenda local para planificar tu salida
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Vive Loja reúne información de eventos, lugares y actividades de Loja, Ecuador. Puedes revisar la fecha, el horario, la ubicación y el precio de cada publicación antes de decidir qué hacer.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Los datos pueden cambiar por decisión del organizador. Para eventos con programación oficial, confirma siempre los detalles en el enlace publicado por la organización.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">También te puede interesar</h2>
            <ul className="mt-4 space-y-3">
              {relatedPages.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    {page.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="preguntas-frecuentes" className="space-y-4">
          <h2 id="preguntas-frecuentes" className="text-2xl font-semibold tracking-tight text-foreground">
            Preguntas frecuentes
          </h2>
          <div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card px-5">
            {config.faqs.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="cursor-pointer list-none pr-6 text-base font-semibold text-foreground marker:hidden">
                  {faq.question}
                </summary>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
