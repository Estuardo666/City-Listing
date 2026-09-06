import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * One-off: drops the hero from the home and turns "Hoy en Loja" into an
 * ordinary events carousel.
 *
 * The hero is deactivated rather than deleted, and the legacy block is
 * converted in place instead of being replaced, so both are one toggle away
 * from coming back in /admin/home.
 */
async function main() {
  const hero = await prisma.homeSection.findFirst({ where: { type: 'hero' } })
  if (hero) {
    await prisma.homeSection.update({ where: { id: hero.id }, data: { isActive: false } })
    console.log(`Desactivado el hero "${hero.title}".`)
  }

  const legacy = await prisma.homeSection.findFirst({ where: { type: 'todayInLoja' } })
  if (legacy) {
    await prisma.homeSection.update({
      where: { id: legacy.id },
      data: {
        type: 'eventList',
        layout: 'carousel',
        title: 'Hoy en Loja',
        subtitle: null,
        actionLabel: 'Ver todo',
        params: { dateRange: 'today', sort: 'soon', limit: 12 },
        isActive: true,
      },
    })
    console.log('"Hoy en Loja" es ahora un carrusel de eventos de hoy.')
  }

  const rows = await prisma.homeSection.findMany({
    orderBy: { order: 'asc' },
    select: { order: true, type: true, title: true, isActive: true, layout: true },
  })
  console.log(
    rows
      .map((row) => `${row.order} ${row.isActive ? '●' : '○'} ${row.type}/${row.layout} — ${row.title}`)
      .join('\n'),
  )
}

main().finally(() => prisma.$disconnect())
