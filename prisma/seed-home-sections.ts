import { PrismaClient, type Prisma } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seeds the home composition with the layout that used to be hardcoded, so
 * switching the clients to server-driven sections changes nothing visible on
 * day one. Idempotent: it only writes when the table is empty.
 *
 *   npx tsx prisma/seed-home-sections.ts
 */
const SECTIONS: Array<{
  type: string
  title: string
  subtitle?: string
  actionLabel?: string
  layout: string
  params: Prisma.InputJsonValue
}> = [
  {
    type: 'hero',
    title: 'Loja está viva',
    subtitle: 'Descubre qué hacer hoy cerca de ti',
    actionLabel: 'Explorar el mapa',
    layout: 'hero',
    params: { ctaLabel: 'Explorar el mapa', ctaDeeplink: '/explorar' },
  },
  { type: 'todayInLoja', title: 'Hoy en Loja', layout: 'list', params: {} },
  { type: 'categoryChips', title: 'Categorías', actionLabel: 'Ver todo', layout: 'chips', params: { limit: 12 } },
  {
    type: 'venueList',
    title: 'Destacados',
    actionLabel: 'Ver todo',
    layout: 'carousel',
    params: { featured: true, sort: 'featured', limit: 12 },
  },
  {
    type: 'ranked',
    title: 'Top 10 en Loja',
    layout: 'ranked',
    params: { kind: 'venue', window: '24h', limit: 10 },
  },
  {
    type: 'eventList',
    title: 'Esta semana',
    actionLabel: 'Ver todo',
    layout: 'carousel',
    params: { dateRange: 'week', sort: 'soon', limit: 12 },
  },
  {
    type: 'venueList',
    title: 'Últimos locales',
    actionLabel: 'Ver todo',
    layout: 'carousel',
    params: { sort: 'recent', limit: 12 },
  },
  {
    type: 'venueList',
    title: 'Comer y beber',
    actionLabel: 'Ver todo',
    layout: 'carousel',
    params: { categorySlug: 'gastronomia', sort: 'rating', limit: 12 },
  },
  { type: 'promotions', title: 'Ofertas', actionLabel: 'Ver todo', layout: 'carousel', params: { limit: 6 } },
  {
    type: 'posts',
    title: 'Actualidad en Loja',
    actionLabel: 'Ver todo',
    layout: 'list',
    params: { limit: 6 },
  },
  { type: 'routes', title: 'Rutas para un día', actionLabel: 'Ver todo', layout: 'carousel', params: { limit: 8 } },
]

async function main() {
  const existing = await prisma.homeSection.count()
  if (existing > 0) {
    console.log(`HomeSection ya tiene ${existing} filas; no se hace nada.`)
    return
  }

  // A "Comer y beber" row pointing at a category that does not exist would
  // resolve to nothing, so the slug is checked before it is seeded.
  const categorySlugs = new Set(
    (await prisma.category.findMany({ select: { slug: true } })).map((category) => category.slug),
  )

  const rows = SECTIONS.filter((section) => {
    const slug = (section.params as { categorySlug?: string }).categorySlug
    return !slug || categorySlugs.has(slug)
  })

  await prisma.homeSection.createMany({
    data: rows.map((section, index) => ({
      type: section.type,
      title: section.title,
      subtitle: section.subtitle ?? null,
      actionLabel: section.actionLabel ?? null,
      layout: section.layout,
      params: section.params,
      order: index,
    })),
  })

  console.log(`Sembradas ${rows.length} secciones de inicio.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
