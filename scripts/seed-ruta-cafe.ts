import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const COFFEE_IMAGE = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1400&q=85'
const COFFEE_DETAIL_IMAGE = 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1000&q=85'
const COFFEE_ALT_IMAGE = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000&q=85'

/**
 * Content seed for the Ruta del Café de Loja.
 * The participating names and addresses come from the public Ruta del Café
 * directory published by the Prefectura de Loja. Hours are intentionally not
 * copied here because they can change and should be refreshed independently.
 */
const STOPS = [
  {
    name: 'Cronopios',
    slug: 'cronopios',
    address: 'Calle Bernardo Valdivieso y Azuay, Plaza de las Flores / Plaza 1ro. de Mayo',
    description: 'Café de especialidad, literatura y poesía en el centro histórico de Loja.',
    notes: 'Empieza aquí con un café de origen y una pausa entre libros.',
    image: COFFEE_DETAIL_IMAGE,
  },
  {
    name: 'Cumandá Special Coffee',
    slug: 'cumanda-special-coffee',
    address: 'Calle Bernardo Valdivieso entre Mercadillo y Azuay',
    description: 'Cafetería familiar con métodos de extracción y una mirada especial al café lojano.',
    notes: 'Pregunta por el método recomendado para el grano del día.',
    image: COFFEE_ALT_IMAGE,
  },
  {
    name: 'Dagadá Cafetería de Especialidad',
    slug: 'dagada-cafeteria-de-especialidad',
    address: '24 de Mayo entre Lourdes y Leopoldo Palacios',
    description: 'Café de especialidad, tostado preciso y una propuesta gastronómica para descubrir nuevos perfiles.',
    notes: 'Una parada ideal para probar algo dulce junto a la taza.',
    image: COFFEE_DETAIL_IMAGE,
  },
  {
    name: 'El Café de la Casa',
    slug: 'el-cafe-de-la-casa',
    address: 'Antonio José de Sucre 215-38 y Cariamanga',
    description: 'Café, arte y gastronomía en los exteriores de La Casa de Manuel Hotel Boutique.',
    notes: 'Haz de esta parada un desayuno tranquilo para tomar impulso.',
    image: COFFEE_ALT_IMAGE,
  },
  {
    name: 'Kaffee Combi',
    slug: 'kaffee-combi',
    address: 'Calles Uruguay y Nicaragua',
    description: 'Una parada urbana para disfrutar café y conversación al final de la tarde.',
    notes: 'Perfecta para cerrar el recorrido con una bebida de autor.',
    image: COFFEE_DETAIL_IMAGE,
  },
  {
    name: 'Kaweh Coffee Shop',
    slug: 'kaweh-coffee-shop',
    address: 'Calle Alonso de Mercadillo',
    description: 'Cafetería con cafés de Hacienda La Florida, catas y métodos de extracción.',
    notes: 'Si te interesa el origen, pide que te cuenten la trazabilidad del café.',
    image: COFFEE_ALT_IMAGE,
  },
  {
    name: 'La Mina',
    slug: 'la-mina-cafeteria',
    address: 'Loja, Ecuador',
    description: 'Cafetería lojana con una carta de opciones dulces y saladas para acompañar el café.',
    notes: 'Una parada flexible para comer algo antes de continuar.',
    image: COFFEE_DETAIL_IMAGE,
  },
  {
    name: 'Ricuras de Sal y Dulce',
    slug: 'ricuras-de-sal-y-dulce',
    address: 'José Joaquín de Olmedo y González Suárez',
    description: 'Cocina tradicional y café de especialidad lojano en una propuesta que celebra los sabores locales.',
    notes: 'Combina la taza con una preparación regional para conocer otro lado de Loja.',
    image: COFFEE_ALT_IMAGE,
  },
  {
    name: 'Cafetería Sonesta Hotel',
    slug: 'cafeteria-sonesta-hotel',
    address: 'Avenida Zoilo Rodríguez y Antisana',
    description: 'Un espacio cómodo para disfrutar café de especialidad con vista a la ciudad.',
    notes: 'Ideal para una pausa con panorama y ritmo más lento.',
    image: COFFEE_DETAIL_IMAGE,
  },
  {
    name: 'Soul Coffee House',
    slug: 'soul-coffee-house',
    address: 'Roma y París, subiendo a la UTPL',
    description: 'Café de especialidad, laboratorio de café y una vista privilegiada hacia la ciudad.',
    notes: 'Reserva esta parada para conversar sobre tu método favorito.',
    image: COFFEE_ALT_IMAGE,
  },
  {
    name: 'Viviates Coffee Shop',
    slug: 'viviates-coffee-shop',
    address: 'Av. 8 de Diciembre y Juan José Flores, bajo Hotel Eudiq',
    description: 'Café de finca propia en Sozoranga y distintos métodos de extracción en un ambiente cálido.',
    notes: 'Termina la ruta con un café de origen ligado directamente a una finca lojana.',
    image: COFFEE_DETAIL_IMAGE,
  },
] as const

const ARTICLES = [
  {
    title: 'Ruta del Café de Loja: guía para recorrer sus cafeterías de especialidad',
    slug: 'ruta-del-cafe-loja-guia-cafeterias',
    excerpt: 'Una guía práctica para vivir la primera etapa de la Ruta del Café de Loja, con paradas, ideas para probar y consejos antes de salir.',
    content: `La Ruta del Café de Loja empieza en la ciudad: en cafeterías donde el café de especialidad se prepara con cuidado y cada barista puede contarte algo distinto sobre el origen, el tueste y el método de extracción.

Esta guía reúne once paradas de la primera etapa: Cronopios, Cumandá Special Coffee, Dagadá, El Café de la Casa, Kaffee Combi, Kaweh Coffee Shop, La Mina, Ricuras de Sal y Dulce, Cafetería Sonesta Hotel, Soul Coffee House y Viviates Coffee Shop.

No tienes que visitarlas todas en un solo día. La mejor manera de recorrerlas es elegir tres o cuatro, caminar entre las del centro y dejar para otro momento las que están hacia la UTPL o en sectores más alejados. Así puedes conversar, probar métodos distintos y disfrutar la ciudad sin convertir la ruta en una carrera.

Antes de salir, revisa el horario del local y confirma si la carta del día cambió. En cada parada pregunta por el origen del grano, las notas que puedes esperar y qué preparación recomienda el equipo. La ruta se disfruta más cuando la taza también cuenta una historia.

Consulta el recorrido completo en https://viveloja.com/rutas/ruta-del-cafe-loja y guarda tus paradas favoritas para volver a ellas.`,
    image: COFFEE_IMAGE,
    featured: true,
  },
  {
    title: 'Cómo pedir café de especialidad en Loja sin complicarte',
    slug: 'como-pedir-cafe-de-especialidad-loja',
    excerpt: 'Métodos, sabores y preguntas sencillas para disfrutar mejor tu próxima parada en la Ruta del Café.',
    content: `Pedir un café de especialidad no debería sentirse como un examen. En una cafetería de la Ruta del Café puedes empezar con una pregunta simple: “¿Qué me recomiendan probar hoy?”. El equipo suele conocer el grano disponible y puede orientarte según lo que te gusta.

Si prefieres una taza limpia y aromática, pregunta por un filtrado. Si buscas más cuerpo y una textura intensa, un espresso o una bebida con leche puede ser un buen punto de partida. También puedes pedir que te expliquen la diferencia entre dos métodos sin necesidad de saber sus nombres de antemano.

Prueba primero el café sin azúcar durante unos segundos. Busca si encuentras notas frutales, florales, dulces o achocolatadas. No hay una respuesta correcta: la mejor taza es la que te invita a volver.

La ruta también es una oportunidad para apoyar a cafeterías, baristas y productores. Cada visita convierte el café lojano en una experiencia viva, no solo en un producto que se sirve.`,
    image: COFFEE_DETAIL_IMAGE,
    featured: true,
  },
  {
    title: 'Del origen a la taza: por qué el café lojano merece una ruta',
    slug: 'cafe-lojano-del-origen-a-la-taza',
    excerpt: 'La historia de una bebida que conecta fincas, baristas, cafeterías y visitantes en la provincia de Loja.',
    content: `El café lojano se entiende mejor cuando se sigue su recorrido. Detrás de una taza hay una finca, una variedad, una cosecha, un proceso de postcosecha y decisiones de tueste que cambian por completo el resultado final.

La Ruta del Café conecta ese trabajo con la ciudad. Las cafeterías son el primer encuentro para muchas personas: allí el grano deja de ser anónimo y se vuelve aroma, temperatura, textura y conversación. Algunas paradas trabajan con cafés de fincas específicas; otras exploran varios métodos y perfiles.

La iniciativa también abre una puerta hacia las siguientes etapas de la ruta: las fincas agroturísticas de la provincia y las cafeterías de las cabeceras cantonales. Es una forma de viajar más despacio y entender el territorio a través de sus productores y sus sabores.

Cuando visites una cafetería, pregunta de dónde viene el café y qué prácticas de producción conocen. Esa curiosidad ayuda a valorar el trabajo que empieza mucho antes de que la taza llegue a la mesa.`,
    image: COFFEE_ALT_IMAGE,
    featured: true,
  },
] as const

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@viveloja.com' },
    update: {},
    create: { email: 'admin@viveloja.com', name: 'Admin Vive Loja', role: 'ADMIN' },
  })

  const venueCategory = await prisma.category.upsert({
    where: { slug: 'cafeterias' },
    update: { name: 'Cafeterías', type: 'VENUE' },
    create: { name: 'Cafeterías', slug: 'cafeterias', icon: '☕', color: '#a16207', type: 'VENUE' },
  })

  const postCategory = await prisma.category.upsert({
    where: { slug: 'guias' },
    update: { name: 'Guías', type: 'POST' },
    create: { name: 'Guías', slug: 'guias', icon: '📖', color: '#16a34a', type: 'POST' },
  })

  const venueIds: string[] = []
  for (const [index, stop] of STOPS.entries()) {
    const venue = await prisma.venue.upsert({
      where: { slug: stop.slug },
      update: { status: 'APPROVED', isActive: true },
      create: {
        name: stop.name,
        slug: stop.slug,
        description: stop.description,
        content: `${stop.description} Forma parte de la Ruta del Café de Loja. Confirma horarios y disponibilidad directamente con el establecimiento.`,
        image: stop.image,
        location: 'Loja, Ecuador',
        address: stop.address,
        status: 'APPROVED',
        isActive: true,
        featured: index < 3,
        userId: admin.id,
      },
    })

    await prisma.venueCategory.upsert({
      where: { venueId_categoryId: { venueId: venue.id, categoryId: venueCategory.id } },
      update: {},
      create: { venueId: venue.id, categoryId: venueCategory.id },
    })
    venueIds.push(venue.id)
  }

  const route = await prisma.route.upsert({
    where: { slug: 'ruta-del-cafe-loja' },
    update: {
      title: 'Ruta del Café de Loja',
      description: 'Un recorrido por cafeterías de especialidad para descubrir el café lojano, sus métodos y las historias detrás de cada taza.',
      content: 'La primera etapa de la Ruta del Café se vive en las cafeterías de la ciudad de Loja. Elige tus paradas, pregunta por el origen de cada grano y recorre la ciudad a tu propio ritmo. Los horarios y la disponibilidad pueden cambiar, así que conviene confirmarlos antes de salir.',
      image: COFFEE_IMAGE,
      duration: '1 día',
      difficulty: 'Fácil',
      type: 'gastronomic',
      status: 'APPROVED',
      featured: true,
      days: 1,
      estimatedMinutes: 300,
    },
    create: {
      title: 'Ruta del Café de Loja',
      slug: 'ruta-del-cafe-loja',
      description: 'Un recorrido por cafeterías de especialidad para descubrir el café lojano, sus métodos y las historias detrás de cada taza.',
      content: 'La primera etapa de la Ruta del Café se vive en las cafeterías de la ciudad de Loja. Elige tus paradas, pregunta por el origen de cada grano y recorre la ciudad a tu propio ritmo. Los horarios y la disponibilidad pueden cambiar, así que conviene confirmarlos antes de salir.',
      image: COFFEE_IMAGE,
      duration: '1 día',
      difficulty: 'Fácil',
      type: 'gastronomic',
      status: 'APPROVED',
      featured: true,
      days: 1,
      estimatedMinutes: 300,
      userId: admin.id,
    },
  })

  for (const [index, stop] of STOPS.entries()) {
    await prisma.routeStop.upsert({
      where: { routeId_day_order: { routeId: route.id, day: 1, order: index + 1 } },
      update: {
        venueId: venueIds[index],
        title: stop.name,
        notes: stop.notes,
        image: stop.image,
        travelMinutes: index === 0 ? null : 8,
      },
      create: {
        routeId: route.id,
        venueId: venueIds[index],
        title: stop.name,
        notes: stop.notes,
        order: index + 1,
        day: 1,
        image: stop.image,
        travelMinutes: index === 0 ? null : 8,
      },
    })
  }

  const tags = await Promise.all([
    prisma.tag.upsert({ where: { slug: 'ruta-del-cafe' }, update: {}, create: { name: 'Ruta del Café', slug: 'ruta-del-cafe' } }),
    prisma.tag.upsert({ where: { slug: 'cafe-de-especialidad' }, update: {}, create: { name: 'Café de especialidad', slug: 'cafe-de-especialidad' } }),
    prisma.tag.upsert({ where: { slug: 'turismo-loja' }, update: {}, create: { name: 'Turismo en Loja', slug: 'turismo-loja' } }),
  ])

  for (const article of ARTICLES) {
    const post = await prisma.post.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        image: article.image,
        status: 'APPROVED',
        featured: article.featured,
        publishedAt: new Date(),
        categoryId: postCategory.id,
      },
      create: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        image: article.image,
        status: 'APPROVED',
        featured: article.featured,
        publishedAt: new Date(),
        userId: admin.id,
        categoryId: postCategory.id,
      },
    })

    for (const tag of tags) {
      await prisma.postTag.upsert({
        where: { postId_tagId: { postId: post.id, tagId: tag.id } },
        update: {},
        create: { postId: post.id, tagId: tag.id },
      })
    }
  }

  console.log(`Ruta creada: /rutas/${route.slug} con ${STOPS.length} paradas.`)
  console.log(`Artículos publicados: ${ARTICLES.length}.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
