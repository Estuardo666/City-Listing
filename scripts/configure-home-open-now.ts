import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * One-off: replaces the seeded "Hoy en Loja" block with a configurable
 * "Abiertos ahora" carousel.
 *
 * The legacy row is only deactivated, not deleted, so it can be switched back
 * on from /admin/home if the carousel turns out to be worse.
 */
const CATEGORY_SLUGS = [
  'gastronomia',
  'entretenimiento',
  'turismo',
  'alojamiento',
  'deportes',
  'cultura',
  'mascotas',
]

async function main() {
  const known = new Set(
    (await prisma.category.findMany({ where: { slug: { in: CATEGORY_SLUGS } }, select: { slug: true } })).map(
      (category) => category.slug,
    ),
  )
  const missing = CATEGORY_SLUGS.filter((slug) => !known.has(slug))
  if (missing.length) console.warn('Slugs inexistentes, se omiten:', missing.join(', '))
  const categorySlugs = CATEGORY_SLUGS.filter((slug) => known.has(slug))

  const legacy = await prisma.homeSection.findFirst({ where: { type: 'todayInLoja' } })
  if (legacy) {
    await prisma.homeSection.update({ where: { id: legacy.id }, data: { isActive: false } })
    console.log(`Desactivada la sección legacy "${legacy.title}".`)
  }

  const existing = await prisma.homeSection.findFirst({ where: { type: 'openNow' } })
  if (existing) {
    await prisma.homeSection.update({
      where: { id: existing.id },
      data: { params: { categorySlugs, limit: 12 } },
    })
    console.log('Actualizadas las categorías de la sección "Abiertos ahora".')
  } else {
    // Right after the hero, where the legacy block used to sit.
    const order = (legacy?.order ?? 1) + 0
    await prisma.homeSection.updateMany({ where: { order: { gte: order } }, data: { order: { increment: 1 } } })
    await prisma.homeSection.create({
      data: {
        type: 'openNow',
        title: 'Abiertos ahora',
        subtitle: 'Locales con la puerta abierta en este momento',
        actionLabel: 'Ver todo',
        layout: 'carousel',
        params: { categorySlugs, limit: 12 },
        order,
      },
    })
    console.log('Creada la sección "Abiertos ahora".')
  }

  const rows = await prisma.homeSection.findMany({
    orderBy: { order: 'asc' },
    select: { order: true, type: true, title: true, isActive: true },
  })
  console.log(
    rows
      .map((row) => `${row.order} ${row.isActive ? '●' : '○'} ${row.type} — ${row.title}`)
      .join('\n'),
  )
}

main().finally(() => prisma.$disconnect())
