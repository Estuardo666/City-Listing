import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, Trophy, Info } from 'lucide-react'
import { JsonLd, buildRankingJsonLd } from '@/components/json-ld'
import { RankingList } from '@/components/features/rankings/ranking-list'
import {
  getCategoryBySlug,
  getCategorySlugsForStaticParams,
  getCategoryWithChildrenSlugs,
  getParentVenueCategories,
} from '@/lib/queries/categories'
import { getRankedVenues, MIN_REVIEWS_FOR_RANKING } from '@/lib/rankings'

export const revalidate = 3600

export async function generateStaticParams() {
  return getCategorySlugsForStaticParams()
}

type PageProps = {
  params: Promise<{ categorySlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params
  const category = await getCategoryBySlug(categorySlug)

  if (!category) return { title: 'No encontrado' }

  const title = `Mejores ${category.name} en Loja | Ranking ViveLoja`
  const description = `Descubre el ranking de los mejores ${category.name.toLowerCase()} en Loja. Basado en calificaciones, resenas e interacciones de la comunidad en ViveLoja.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://viveloja.com/mejores/${category.slug}`,
      siteName: 'ViveLoja',
      type: 'website',
      locale: 'es_EC',
    },
    alternates: {
      canonical: `https://viveloja.com/mejores/${category.slug}`,
    },
  }
}

const RANKING_TAKE = 20

export default async function RankingPage({ params }: PageProps) {
  const { categorySlug } = await params

  const category = await getCategoryBySlug(categorySlug)

  if (!category || category.type !== 'VENUE') notFound()

  const childSlugs = await getCategoryWithChildrenSlugs(categorySlug)

  const [rankedVenues, otherCategories] = await Promise.all([
    getRankedVenues(childSlugs, RANKING_TAKE),
    getParentVenueCategories(),
  ])

  const jsonLd = buildRankingJsonLd({
    name: `Top ${category.name} de Loja`,
    slug: category.slug,
    venues: rankedVenues.map((v) => ({
      name: v.name,
      slug: v.slug,
      image: v.image,
      avgRating: v.avgRating,
      reviewCount: v.reviewCount,
      address: v.address,
      phone: v.phone,
    })),
  })

  return (
    <div className="bg-background pt-14">
      <JsonLd data={jsonLd} />

      <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={`/${category.slug}`}
            className="inline-flex items-center gap-1.5 text-foreground transition-colors hover:text-emerald"
          >
            <ArrowLeft className="h-4 w-4" />
            {category.name}
          </Link>
          <span>/</span>
          <span>Ranking</span>
        </div>

        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
            <Trophy className="h-8 w-8 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Top {category.name} de Loja
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Ranking basado en calificaciones, cantidad de resenas, interacciones de la comunidad
              y actividad reciente. Solo negocios con al menos {MIN_REVIEWS_FOR_RANKING} resenas participan.
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-secondary/30 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <strong className="font-medium text-foreground">Como se calcula el ranking:</strong>{' '}
              Se considera la calificacion promedio (35%), cantidad de resenas (25%), popularidad (15%),
              actividad reciente (15%) e interacciones como favoritos y check-ins (10%).
            </p>
            <p>
              Los negocios con menos de {MIN_REVIEWS_FOR_RANKING} resenas no participan para evitar
              posiciones infladas por pocas opiniones.
            </p>
          </div>
        </div>

        {/* Ranking */}
        {rankedVenues.length > 0 ? (
          <RankingList
            venues={rankedVenues}
            title={`Ranking de ${category.name}`}
            subtitle={`${rankedVenues.length} negocios calificados por la comunidad lojana`}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card py-16 text-center">
            <span className="text-4xl">📊</span>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">
                Aun no hay suficientes datos
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Los {category.name.toLowerCase()} de Loja necesitan al menos {MIN_REVIEWS_FOR_RANKING} resenas
                para aparecer en el ranking. Anima a la comunidad a dejar sus opiniones.
              </p>
            </div>
            <Link
              href={`/${category.slug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Ver todos los {category.name.toLowerCase()}
            </Link>
          </div>
        )}

        {/* Enlaces a otros rankings */}
        {otherCategories.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Rankings de otras categorias
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherCategories
                .filter((c) => c.slug !== category.slug)
                .map((c) => (
                  <Link
                    key={c.id}
                    href={`/mejores/${c.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-emerald"
                  >
                    {c.icon && <span>{c.icon}</span>}
                    Top {c.name}
                  </Link>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
