import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const NEW_SLUGS = [
  'gastronomia','alojamiento','turismo','compras','salud-bienestar','educacion',
  'cultura','entretenimiento','deportes','automotriz-transporte','gobierno-instituciones',
  'empresas-servicios','finanzas','mascotas','belleza','inmobiliaria',
  'conciertos','cultura-eventos','deportes-eventos','gastronomia-eventos',
  'tecnologia','negocios','familia','vida-social','educacion-eventos',
  'gobierno-comunidad','religion','naturaleza'
]

async function main() {
  const allCats = await prisma.category.findMany({
    select: {
      id: true, name: true, slug: true, type: true,
      _count: { select: { venueCategories: true, eventCategories: true } }
    },
    orderBy: { name: 'asc' }
  })

  const oldCats = allCats.filter(c => !NEW_SLUGS.includes(c.slug))
  console.log(`OLD CATEGORIES (${oldCats.length}):`)
  for (const c of oldCats) {
    console.log(`  ${c.slug} (${c.name}) - ${c._count.venueCategories} venues, ${c._count.eventCategories} events`)
  }

  const newCats = allCats.filter(c => NEW_SLUGS.includes(c.slug))
  console.log(`\nNEW CATEGORIES (${newCats.length}):`)
  for (const c of newCats) {
    console.log(`  ${c.slug} (${c.name}) - ${c._count.venueCategories} venues, ${c._count.eventCategories} events`)
  }
}

main().then(() => prisma.$disconnect())
