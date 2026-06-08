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

export async function getCategoryBySlug(slug: string) {
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
}

export async function getCategorySlugsForStaticParams() {
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
  const title = category.seoTitle ?? `${category.name} en Loja | ViveLoja`
  const description =
    category.seoDescription ??
    `Descubre los mejores ${category.name.toLowerCase()} en Loja. Explora horarios, resenas, promociones, ubicacion y mas en ViveLoja.`
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
