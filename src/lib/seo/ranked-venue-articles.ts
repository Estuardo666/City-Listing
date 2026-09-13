import 'server-only'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { GOOGLE_DATA_MAX_AGE_DAYS, googlePlaceUrl, isGoogleDataStale } from '@/lib/google/freshness'

export type RankedVenueArticleConfig = {
  slug: string
  title: string
  description: string
  intro: string
  categorySlug: string
  categoryLabel: string
  indexable?: boolean
  searchTerms?: string[]
  excludeTerms?: string[]
  searchInNameOnly?: boolean
}

export const RANKED_VENUE_ARTICLE_CONFIGS: RankedVenueArticleConfig[] = [
  {
    slug: 'mejores-restaurantes-loja',
    title: 'Mejores restaurantes de Loja según sus valoraciones',
    description:
      'Descubre los restaurantes mejor calificados de Loja según valoraciones verificables. Compara puntuación, número de reseñas, ubicación y datos del local.',
    intro:
      'Este ranking reúne restaurantes de Loja con valoraciones públicas disponibles en Google Maps o Vive Loja. Mostramos la fuente y el número de opiniones para que puedas decidir con más contexto.',
    categorySlug: 'gastronomia',
    categoryLabel: 'Gastronomía',
    searchTerms: ['restaurante', 'restaurant', 'comida'],
  },
  {
    slug: 'mejores-cafeterias-loja',
    title: 'Mejores cafeterías de Loja según sus valoraciones',
    description:
      'Encuentra las cafeterías mejor calificadas de Loja según valoraciones verificables. Consulta puntuación, opiniones, dirección y detalles de cada local.',
    intro:
      'Busca una cafetería en Loja para desayunar, trabajar o hacer una pausa. Este ranking usa valoraciones recientes de Google Maps cuando están disponibles y reseñas de Vive Loja como respaldo, sin posiciones pagadas ni puntuaciones inventadas.',
    categorySlug: 'gastronomia',
    categoryLabel: 'Gastronomía',
    searchTerms: ['cafe', 'café', 'cafeteria', 'cafetería'],
  },
  {
    slug: 'mejores-hoteles-loja',
    title: 'Mejores hoteles y alojamientos de Loja según sus valoraciones',
    description:
      'Compara hoteles y alojamientos mejor calificados de Loja según valoraciones verificables. Revisa puntuación, opiniones, ubicación y datos útiles.',
    intro:
      'Si buscas dónde hospedarte en Loja, revisa primero la experiencia de otros visitantes. Esta selección usa valoraciones recientes de Google Maps y reseñas de Vive Loja cuando existen, y deja visible la fuente de cada puntuación.',
    categorySlug: 'alojamiento',
    categoryLabel: 'Alojamiento',
    searchTerms: ['hotel', 'hostal', 'alojamiento'],
  },
  {
    slug: 'mejores-locales-deportivos-loja',
    title: 'Mejores locales deportivos de Loja según sus valoraciones',
    description:
      'Encuentra gimnasios, canchas y locales deportivos mejor calificados de Loja según valoraciones verificables.',
    intro:
      'Para entrenar o practicar deporte en Loja, compara los locales por puntuación, número de reseñas, dirección y servicios publicados. El ranking usa datos recientes de Google Maps o Vive Loja y no posiciones publicitarias.',
    categorySlug: 'deportes',
    categoryLabel: 'Deportes',
    indexable: false,
    searchTerms: ['gimnasio', 'gym', 'deporte', 'cancha'],
  },
  {
    slug: 'mejores-clinicas-loja',
    title: 'Clínicas y centros de salud mejor valorados de Loja',
    description:
      'Compara clínicas, hospitales y centros de salud de Loja según valoraciones públicas verificables, ubicación y número de reseñas.',
    intro:
      'Esta guía reúne clínicas, hospitales y centros médicos de Loja con valoraciones públicas disponibles. La puntuación refleja opiniones en Google Maps o Vive Loja; no constituye una recomendación médica ni sustituye la consulta con un profesional.',
    categorySlug: 'salud-bienestar',
    categoryLabel: 'Salud y Bienestar',
    searchTerms: ['clinica', 'clínica', 'hospital', 'médic', 'medic', 'odont', 'dental', 'salud'],
  },
  {
    slug: 'mejores-gimnasios-loja',
    title: 'Mejores gimnasios y centros fitness de Loja según sus valoraciones',
    description:
      'Encuentra gimnasios y centros fitness mejor valorados de Loja según opiniones públicas verificables, ubicación y número de reseñas.',
    intro:
      'Si buscas un gimnasio en Loja, compara valoraciones públicas, cantidad de reseñas, ubicación y la información disponible de cada local. El orden refleja datos recientes de Google Maps o reseñas de Vive Loja y no posiciones pagadas.',
    categorySlug: 'salud-bienestar',
    categoryLabel: 'Salud y Bienestar',
    searchTerms: ['gimnasio', 'gym', 'fitness', 'training', 'crossfit', 'yoga'],
  },
  {
    slug: 'mejores-bares-loja',
    title: 'Mejores bares de Loja según sus valoraciones',
    description:
      'Encuentra bares y restobares mejor valorados de Loja según opiniones públicas verificables, ubicación y número de reseñas.',
    intro:
      'Esta selección reúne bares, pubs y restobares de Loja con valoraciones públicas recientes. Comparamos puntuación, cantidad de reseñas y ubicación para ayudarte a elegir una salida, sin presentar posiciones pagadas como un ranking editorial.',
    categorySlug: 'gastronomia',
    categoryLabel: 'Gastronomía',
    searchInNameOnly: true,
    searchTerms: ['restobar', 'resto-pub', 'pub', 'discoteca', 'cerveza', 'coctel', 'karaoke', 'lounge', 'bar'],
    excludeTerms: ['dental', 'protein', 'nutricion', 'fitness', 'gimnasio', 'farmacia'],
  },
  {
    slug: 'mejores-hostales-loja',
    title: 'Mejores hostales de Loja según sus valoraciones',
    description:
      'Compara hostales y hosterías mejor valorados de Loja según reseñas públicas verificables, ubicación y número de opiniones.',
    intro:
      'Si buscas un hostal en Loja, esta guía te permite comparar alojamientos con valoraciones públicas recientes. El orden considera puntuación, número de reseñas y nombre; revisa siempre disponibilidad, tarifas y condiciones directamente con el establecimiento.',
    categorySlug: 'alojamiento',
    categoryLabel: 'Alojamiento',
    searchInNameOnly: true,
    searchTerms: ['hostal', 'hostería', 'hosteria'],
  },
  {
    slug: 'mejores-pizzerias-loja',
    title: 'Mejores pizzerías de Loja según sus valoraciones',
    description:
      'Descubre pizzerías de Loja con valoraciones públicas verificables y compara puntuación, reseñas y ubicación antes de pedir o visitar.',
    intro:
      'Esta guía reúne pizzerías de Loja que aparecen en la base local con una valoración reciente de Google Maps. La lista es una referencia basada en datos públicos: confirma menú, horarios, cobertura de entrega y precios antes de hacer tu pedido.',
    categorySlug: 'gastronomia',
    categoryLabel: 'Gastronomía',
    searchInNameOnly: true,
    searchTerms: ['pizza'],
  },
  {
    slug: 'mejores-odontologos-loja',
    title: 'Odontólogos y clínicas dentales mejor valorados de Loja',
    description:
      'Compara odontólogos y clínicas dentales de Loja según valoraciones públicas verificables, ubicación y número de reseñas.',
    intro:
      'Esta guía sirve para localizar consultorios y clínicas dentales de Loja con valoraciones públicas disponibles. La puntuación no sustituye una evaluación profesional: verifica especialidad, licencias, costos y disponibilidad directamente con el prestador de salud.',
    categorySlug: 'salud-bienestar',
    categoryLabel: 'Salud y Bienestar',
    searchInNameOnly: true,
    searchTerms: ['odont', 'dental', 'dentist'],
  },
]

export const RANKED_VENUE_ARTICLE_PATHS = RANKED_VENUE_ARTICLE_CONFIGS
  .filter((article) => article.indexable !== false)
  .map((article) => article.slug)

export type RankedVenueRatingSource = 'Google Maps' | 'Vive Loja'

const venueSelect = Prisma.validator<Prisma.VenueSelect>()({
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  address: true,
  location: true,
  avgRating: true,
  reviewCount: true,
  googlePlaceId: true,
  googleRating: true,
  googleReviewCount: true,
  googleLastSyncAt: true,
})

function rankableRatingFilter(): Prisma.VenueWhereInput {
  const googleCutoff = new Date(Date.now() - GOOGLE_DATA_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)

  return {
    OR: [
      {
        AND: [
          { googlePlaceId: { not: null } },
          { googleRating: { not: null } },
          { googleReviewCount: { gt: 0 } },
          { googleLastSyncAt: { gte: googleCutoff } },
        ],
      },
      {
        avgRating: { not: null },
        reviewCount: { gt: 0 },
      },
    ],
  }
}

function venueWhere(config: RankedVenueArticleConfig): Prisma.VenueWhereInput {
  const where: Prisma.VenueWhereInput = {
    status: 'APPROVED',
    isActive: true,
    venueCategories: {
      some: {
        category: { slug: config.categorySlug },
      },
    },
    AND: [rankableRatingFilter()],
  }

  if (config.searchTerms?.length) {
    where.AND = [
      ...(where.AND as Prisma.VenueWhereInput[]),
      {
        OR: config.searchTerms.flatMap((term) => {
          const text = { contains: term, mode: 'insensitive' as const }
          return config.searchInNameOnly
            ? [{ name: text }]
            : [
                { name: text },
                { description: text },
                { location: text },
                { address: text },
              ]
        }),
      },
    ]
  }

  if (config.excludeTerms?.length) {
    where.AND = [
      ...(where.AND as Prisma.VenueWhereInput[]),
      {
        NOT: {
          OR: config.excludeTerms.flatMap((term) => {
            const text = { contains: term, mode: 'insensitive' as const }
            return config.searchInNameOnly
              ? [{ name: text }]
              : [
                  { name: text },
                  { description: text },
                  { location: text },
                  { address: text },
                ]
          }),
        },
      },
    ]
  }

  return where
}

export type RankedVenue = {
  id: string
  name: string
  slug: string
  description: string
  image: string | null
  address: string | null
  location: string
  rating: number
  ratingCount: number
  ratingSource: RankedVenueRatingSource
  ratingUrl: string | null
}

export async function getRankedVenues(
  config: RankedVenueArticleConfig,
  take = 10,
) {
  const venues = await prisma.venue.findMany({
    where: venueWhere(config),
    select: venueSelect,
  })

  const ranked: RankedVenue[] = venues.map((venue) => {
    const hasFreshGoogleRating =
      venue.googlePlaceId !== null &&
      venue.googleRating !== null &&
      venue.googleReviewCount > 0 &&
      !isGoogleDataStale(venue.googleLastSyncAt)

    return {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      description: venue.description,
      image: venue.image,
      address: venue.address,
      location: venue.location,
      rating: hasFreshGoogleRating ? venue.googleRating! : venue.avgRating!,
      ratingCount: hasFreshGoogleRating ? venue.googleReviewCount : venue.reviewCount,
      ratingSource: hasFreshGoogleRating ? 'Google Maps' : 'Vive Loja',
      ratingUrl: hasFreshGoogleRating ? googlePlaceUrl(venue.googlePlaceId!) : null,
    }
  })

  ranked.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount || a.name.localeCompare(b.name, 'es'))
  return ranked.slice(0, take)
}

export async function countRankedVenueCandidates(config: RankedVenueArticleConfig) {
  return prisma.venue.count({ where: venueWhere(config) })
}
