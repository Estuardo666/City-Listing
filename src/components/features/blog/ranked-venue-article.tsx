import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin, Star } from 'lucide-react'
import {
  RANKED_VENUE_ARTICLE_CONFIGS,
  type RankedVenue,
  type RankedVenueArticleConfig,
} from '@/lib/seo/ranked-venue-articles'
import { SITE_URL } from '@/lib/seo/event-landings'
import { JsonLd } from '@/components/json-ld'
import {
  buildArticleJsonLd,
  buildBreadcrumbListJsonLd,
  buildVenueRankingJsonLd,
} from '@/lib/seo/json-ld-builders'

type RankedVenueArticleProps = {
  config: RankedVenueArticleConfig
  venues: RankedVenue[]
  candidateCount: number
}

export function RankedVenueArticle({ config, venues, candidateCount }: RankedVenueArticleProps) {
  const content = [
    config.intro,
    `La selección se limita a locales aprobados y activos de la categoría ${config.categoryLabel} que tienen una valoración verificable. Usamos una valoración reciente de Google Maps cuando existe; si no, usamos las reseñas publicadas en Vive Loja. Ordenamos primero por puntuación, luego por cantidad de reseñas y finalmente por nombre.`,
    'Una valoración alta con pocas reseñas debe interpretarse con cuidado. Por eso mostramos ambos datos y recomendamos leer la ficha completa, confirmar horarios y contactar al local antes de trasladarte.',
  ]
  const articleJsonLd = buildArticleJsonLd({
    title: config.title,
    slug: config.slug,
    excerpt: config.description,
    content: content.join('\n\n'),
    image: venues[0]?.image ?? null,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { name: 'Vive Loja', image: null },
    category: { name: 'Guías locales', slug: 'blog' },
  })
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Inicio', url: SITE_URL },
    { name: 'Blog', url: `${SITE_URL}/blog` },
    { name: config.title },
  ])
  const rankingJsonLd = buildVenueRankingJsonLd({
    name: config.title,
    description: config.description,
    path: `blog/${config.slug}`,
    venues: venues.map((venue) => ({
      name: venue.name,
      slug: venue.slug,
      image: venue.image,
      address: venue.address,
    })),
  })

  return (
    <div className="min-h-screen bg-background pb-20 pt-10 sm:pt-14">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={rankingJsonLd} />

      <main className="section-shell space-y-12 sm:space-y-16">
        <article className="mx-auto max-w-3xl space-y-5">
          <p className="eyebrow text-primary">Guía local · Ranking actualizado</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            {config.title}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{config.intro}</p>
        </article>

        <section aria-labelledby="ranking-locales" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {candidateCount} locales en la categoría
              </p>
              <h2 id="ranking-locales" className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Ranking por valoración disponible
              </h2>
            </div>
            <Link href={`/${config.categorySlug}`} className="text-sm font-semibold text-primary hover:underline">
              Ver categoría completa <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>

          {venues.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {venues.map((venue, index) => (
                <article
                  key={venue.id}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card transition-colors hover:border-primary/30"
                >
                  <Link href={`/locales/${venue.slug}`} className="group block">
                    {venue.image ? (
                      <div className="relative h-44 w-full overflow-hidden bg-accent">
                        <Image
                          src={venue.image}
                          alt={venue.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-bold text-foreground">
                          #{index + 1}
                        </span>
                      </div>
                    ) : null}
                    <div className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-semibold text-foreground group-hover:text-primary">{venue.name}</h3>
                        {!venue.image ? (
                          <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-foreground">
                            #{index + 1}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-foreground">{venue.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({venue.ratingCount} reseñas)</span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Fuente: {venue.ratingSource}</p>
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{venue.description}</p>
                      <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        {venue.address ?? venue.location}
                      </p>
                    </div>
                  </Link>
                  {venue.ratingSource === 'Google Maps' && venue.ratingUrl ? (
                    <div className="border-t border-border/50 px-5 py-3">
                      <a
                        href={venue.ratingUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Ver la ficha y valoración en Google Maps
                      </a>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/60 p-8 text-center">
              <Star className="mx-auto h-8 w-8 text-amber-400" />
              <h3 className="mt-3 text-lg font-semibold text-foreground">Aún no hay suficientes valoraciones para ordenar este ranking</h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Hay locales publicados en esta categoría, pero todavía no tienen una valoración reciente de Google Maps ni reseñas públicas en Vive Loja. El ranking se actualizará automáticamente cuando exista una fuente verificable.
              </p>
              <Link
                href={`/${config.categorySlug}`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Explorar {config.categoryLabel.toLowerCase()} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-3xl space-y-4 border-t border-border/60 pt-10">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Cómo se calcula este ranking</h2>
          <p className="leading-relaxed text-muted-foreground">{content[1]}</p>
          <p className="leading-relaxed text-muted-foreground">{content[2]}</p>
          <p className="leading-relaxed text-muted-foreground">
            Las fichas y las valoraciones pueden cambiar. Consulta siempre la información actual del local y comparte una reseña basada en tu experiencia.
          </p>
        </section>

        <nav aria-label="Más guías de locales" className="mx-auto flex max-w-3xl flex-wrap gap-3">
          {RANKED_VENUE_ARTICLE_CONFIGS
            .filter((article) => article.slug !== config.slug && article.indexable !== false)
            .map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`} className="text-sm font-semibold text-primary hover:underline">
              {article.title}
            </Link>
            ))}
        </nav>
      </main>
    </div>
  )
}
