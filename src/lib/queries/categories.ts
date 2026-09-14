import 'server-only'
import { serverCache } from '@/lib/server-cache'
import { prisma } from '@/lib/prisma'

const CATEGORY_SLUGS_TO_SKIP = [
  'explorar',
  'eventos',
  'locales',
  'blog',
  'ofertas',
  'rutas',
  'colecciones',
  'perfil',
  'dashboard',
  'admin',
  'auth',
  'api',
  'mejores',
]

export async function getParentVenueCategories() {
  return prisma.category.findMany({
    where: {
      type: 'VENUE',
      slug: { notIn: CATEGORY_SLUGS_TO_SKIP },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      introText: true,
      icon: true,
      color: true,
      _count: {
        select: {
          venueCategories: { where: { venue: { status: 'APPROVED' } } },
          subcategories: true,
        },
      },
    },
  })
}

export const getCategoryBySlug = serverCache(async (slug: string) => {
  return prisma.category.findFirst({
    where: {
      slug,
      type: 'VENUE',
    },
    include: {
      subcategories: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
        },
      },
      _count: {
        select: {
          venueCategories: { where: { venue: { status: 'APPROVED' } } },
        },
      },
    },
  })
})

export async function getCategorySlugsForStaticParams() {
  // Cloud Run source builds use the preview environment. Avoid requiring the
  // production database during that build; category pages are rendered on
  // demand there and still use the database at request time.
  if (process.env.VERCEL_ENV === 'preview') return []

  const categories = await prisma.category.findMany({
    where: {
      type: 'VENUE',
      slug: { notIn: CATEGORY_SLUGS_TO_SKIP },
    },
    select: { slug: true },
  })
  return categories.map((c) => ({ categorySlug: c.slug }))
}

export function getCategorySeoData(category: {
  name: string
  slug: string
  seoTitle: string | null
  seoDescription: string | null
  introText: string | null
  description: string | null
}) {
  const title = category.seoTitle ?? `${category.name} en Loja | Vive Loja`
  const description =
    category.seoDescription ??
    `Encuentra ${category.name.toLowerCase()} en Loja: horarios, reseñas, ubicaciones, promociones y datos útiles de negocios locales.`
  const introText =
    category.introText ??
    category.description ??
    `Explora los mejores ${category.name.toLowerCase()} recomendados por la comunidad lojana. Encuentra horarios, resenas, ubicaciones y promociones.`

  return { title, description, introText }
}

export async function getAllVenueCategorySlugsForSitemap() {
  const categories = await prisma.category.findMany({
    where: {
      type: 'VENUE',
      slug: { notIn: CATEGORY_SLUGS_TO_SKIP },
    },
    select: { slug: true, updatedAt: true },
  })
  return categories
}

export async function getCategoryWithChildrenSlugs(slug: string): Promise<string[]> {
  const category = await prisma.category.findFirst({
    where: { slug, type: 'VENUE' },
    select: {
      id: true,
      subcategories: { select: { slug: true } },
    },
  })

  if (!category) return []
  return [slug, ...category.subcategories.map((s) => s.slug)]
}
