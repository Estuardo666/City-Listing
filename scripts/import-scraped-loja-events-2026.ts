import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { displayableEventImageUrl } from '../src/lib/media/event-image'

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env')

  try {
    const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const match = line.match(/^\s*([^#=]+)=(.*)\s*$/)
      if (!match) continue

      const key = match[1].trim()
      const value = match[2].trim().replace(/^(['"])(.*)\1$/, '$2')
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // The deployment environment can provide DATABASE_URL directly.
  }
}

loadDotEnv()

const prisma = new PrismaClient()

const CINEMA_SOURCE = 'https://cinemasin.com.ec/#/loja/cartelera'
const LOJA_TIME_ZONE = '-05:00'

type CategoryKind = 'culture' | 'concerts' | 'gastronomy'

type EventDraft = {
  importKey: string
  title: string
  description: string
  startDate: string
  endDate?: string | null
  price?: number | null
  location: string
  address?: string | null
  image?: string | null
  categoryKinds: CategoryKind[]
  source: string
  organizer?: string | null
  parish?: string | null
}

function lojaDate(value: string): Date {
  return new Date(`${value}${LOJA_TIME_ZONE}`)
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title)
  let candidate = base
  let suffix = 2

  while (await prisma.event.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }

  return candidate
}

const agendaSource = 'https://www.agendaculturalloja.com'

const agendaDrafts: EventDraft[] = [
  {
    importKey: 'agenda:escultura-al-aire-libre-formas-naturales:2026-09-14',
    title: 'Escultura al Aire Libre: Formas Naturales',
    description: 'Instalaciones escultóricas con materiales orgánicos y reciclados en los jardines del Botánico de la UNL.',
    startDate: '2026-09-14T15:56:00',
    location: 'Jardín Botánico Reinaldo Espinosa',
    address: 'San Sebastián, Loja',
    categoryKinds: ['culture'],
    source: `${agendaSource}/eventos/escultura-al-aire-libre-formas-naturales-2026-09-14-jardin-botanico-reinaldo-espinosa`,
    organizer: 'Seed Script Agenda Cultural',
    parish: 'San Sebastián',
  },
  {
    importKey: 'agenda:butoh-y-movimiento-danza-del-alma:2026-09-14',
    title: 'Butoh y Movimiento: Danza del Alma',
    description: 'Espectáculo de danza Butoh al atardecer en los jardines del Botánico. Experiencia contemplativa y sonora.',
    startDate: '2026-09-14T15:56:00',
    location: 'Jardín Botánico Reinaldo Espinosa',
    address: 'San Sebastián, Loja',
    categoryKinds: ['culture'],
    source: `${agendaSource}/eventos/butoh-y-movimiento-danza-del-alma-2026-09-14-jardin-botanico-reinaldo-espinosa`,
    organizer: 'Seed Script Agenda Cultural',
    parish: 'San Sebastián',
  },
  {
    importKey: 'agenda:talleres-bonsai:2026-09-15',
    title: 'Talleres Bonsai',
    description: 'Taller al aire libre de cuidado y prevención de enfermedades en bonsais en Loja.',
    startDate: '2026-09-15T14:15:00',
    location: 'Parque Bolívar Loja Ecuador',
    address: 'El Sagrario, Loja',
    image: 'https://culturallojablog.b-cdn.net/eventos/1788387406439-juvdee.webp',
    categoryKinds: ['culture'],
    source: `${agendaSource}/eventos/talleres-bonsai-2026-09-15-parque-bolivar-loja-ecuador`,
    organizer: 'OBJETIVO BONSAI',
    parish: 'El Sagrario',
  },
  {
    importKey: 'agenda:mercado-organico-y-agroecologico:2026-09-15',
    title: 'Mercado Orgánico y Agroecológico',
    description: 'Feria semanal de productos orgánicos de pequeños productores de Loja, Vilcabamba y Malacatos.',
    startDate: '2026-09-15T15:56:00',
    location: 'Parque Lineal La Tebaida',
    address: 'El Valle, Loja',
    categoryKinds: ['culture', 'gastronomy'],
    source: `${agendaSource}/eventos/mercado-organico-y-agroecologico-2026-09-15-parque-lineal-la-tebaida`,
    organizer: 'Seed Script Agenda Cultural',
    parish: 'El Valle',
  },
  {
    importKey: 'agenda:electronica-y-arte-sonoro-frecuencias-sur:2026-09-16',
    title: 'Electrónica y Arte Sonoro: Frecuencias Sur',
    description: 'Festival de música electrónica experimental y arte sonoro. DJs locales, mapping y visuales en vivo.',
    startDate: '2026-09-16T15:56:00',
    location: 'Explanada UTPL',
    address: 'San Sebastián, Loja',
    categoryKinds: ['culture', 'concerts'],
    source: `${agendaSource}/eventos/electronica-y-arte-sonoro-frecuencias-sur-2026-09-16-explanada-utpl`,
    organizer: 'Seed Script Agenda Cultural',
    parish: 'San Sebastián',
  },
  {
    importKey: 'agenda:festival-intercolegial-de-teatro-2026:2026-09-17',
    title: 'Festival Intercolegial de Teatro 2026',
    description: 'Competencia teatral entre 8 colegios de la provincia. Jurado profesional y premios para las 3 mejores obras.',
    startDate: '2026-09-17T15:56:00',
    location: 'Teatro Universitario UNL',
    address: 'San Sebastián, Loja',
    categoryKinds: ['culture'],
    source: `${agendaSource}/eventos/festival-intercolegial-de-teatro-2026-2026-09-17-teatro-universitario-unl`,
    organizer: 'Seed Script Agenda Cultural',
    parish: 'San Sebastián',
  },
  {
    importKey: 'agenda:presentacion-de-libro-fabrica-de-poesia:2026-09-17',
    title: 'Presentación de libro: Fábrica de Poesía',
    description: 'Presentación del libro “Voces de la Fábrica de Poesía”, proyecto liderado por el poeta Byron Carrión Jumbo.',
    startDate: '2026-09-17T17:00:00',
    location: 'Teatro Bolívar',
    address: 'El Sagrario, Loja',
    image: 'https://culturallojablog.b-cdn.net/eventos/1788974206461-vimpel.webp',
    categoryKinds: ['culture'],
    source: `${agendaSource}/eventos/presentacion-de-libro-fabrica-de-poesia-2026-09-17-teatro-bolivar`,
    organizer: 'Dirección de Cultura del Municipio de Loja',
    parish: 'El Sagrario',
  },
  {
    importKey: 'agenda:expo-turismo-loja-destinos-del-sur:2026-09-18',
    title: 'Expo Turismo Loja: Destinos del Sur',
    description: 'Feria de turismo con operadoras, hoteles y destinos de la provincia de Loja. Conferencias y sorteos de paquetes turísticos.',
    startDate: '2026-09-18T15:56:00',
    location: 'Hotel Howard Johnson Loja',
    address: 'Sucre, Loja',
    categoryKinds: ['culture'],
    source: `${agendaSource}/eventos/expo-turismo-loja-destinos-del-sur-2026-09-18-hotel-howard-johnson-loja`,
    organizer: 'Seed Script Agenda Cultural',
    parish: 'Sucre',
  },
  {
    importKey: 'agenda:acuarelas-del-valle-de-cuxibamba:2026-09-19',
    title: 'Acuarelas del Valle de Cuxibamba',
    description: 'Paisajes del Valle de Cuxibamba pintados en acuarela por la artista lojana María Fernanda Cueva.',
    startDate: '2026-09-19T15:56:00',
    location: 'Sala de Arte del Municipio de Loja',
    address: 'El Sagrario, Loja',
    categoryKinds: ['culture'],
    source: `${agendaSource}/eventos/acuarelas-del-valle-de-cuxibamba-2026-09-19-sala-de-arte-del-municipio-de-loja`,
    organizer: 'Seed Script Agenda Cultural',
    parish: 'El Sagrario',
  },
  {
    importKey: 'agenda:maraton-de-danza-urbana-breaking-loja:2026-09-20',
    title: 'Maratón de Danza Urbana: Breaking Loja',
    description: 'Competencia de breakdance con crews de Loja, Cuenca, Machala y Guayaquil. DJ en vivo y premiación.',
    startDate: '2026-09-20T15:56:00',
    location: 'Explanada del Parque Jipiro',
    address: 'El Valle, Loja',
    categoryKinds: ['culture'],
    source: `${agendaSource}/eventos/maraton-de-danza-urbana-breaking-loja-2026-09-20-explanada-del-parque-jipiro`,
    organizer: 'Seed Script Agenda Cultural',
    parish: 'El Valle',
  },
  {
    importKey: 'agenda:festival-de-cine-peruano-quipu-loja:2026-09-21',
    title: 'Festival de Cine Peruano QUIPU LOJA',
    description: 'Festival de cine peruano Quipu Loja, organizado con el Consulado General del Perú en Loja y la CCE-Loja.',
    startDate: '2026-09-21T10:00:00',
    location: 'Auditorio Pablo Palacio',
    address: 'Sucre, Loja',
    categoryKinds: ['culture'],
    source: `${agendaSource}/eventos/festival-de-cine-peruano-quipu-loja-2026-09-21-auditorio-pablo-palacio`,
    organizer: 'Casa de la Cultura Ecuatoriana Núcleo de Loja',
    parish: 'Sucre',
  },
  {
    importKey: 'agenda:feria-intercultural-de-los-pueblos-del-sur:2026-09-21',
    title: 'Feria Intercultural de los Pueblos del Sur',
    description: 'Encuentro de pueblos y nacionalidades del sur del Ecuador: gastronomía, danza, artesanías y medicina ancestral.',
    startDate: '2026-09-21T15:56:00',
    location: 'Estadio Federativo Reina del Cisne',
    address: 'El Valle, Loja',
    categoryKinds: ['culture', 'gastronomy'],
    source: `${agendaSource}/eventos/feria-intercultural-de-los-pueblos-del-sur-2026-09-21-estadio-federativo-reina-del-cisne`,
    organizer: 'Seed Script Agenda Cultural',
    parish: 'El Valle',
  },
]

const municipioSource = 'https://www.loja.gob.ec/eventos-culturales'

const municipioDrafts: EventDraft[] = [
  {
    importKey: 'municipio:10-anos-musica-ocupa:2026-09-01',
    title: '10 Años Música Ocupa',
    description: 'Programa cultural de septiembre y octubre con encuentros, talleres y conciertos. La ficha municipal presenta el lema: “Todo encuentro comienza con alguien dispuesto a escuchar”.',
    startDate: '2026-09-01T00:00:00',
    endDate: '2026-10-31T00:00:00',
    location: 'Municipio de Loja',
    address: 'Loja, Ecuador',
    categoryKinds: ['culture', 'concerts'],
    source: 'https://www.loja.gob.ec/evento/2026-09/10-anos-musica-ocupa',
    organizer: 'Cultura',
  },
  {
    importKey: 'municipio:talleres-de-marinera-y-cajon-peruano:2026-09-17',
    title: 'Talleres de Marinera y Cajón Peruano',
    description: 'Talleres de marinera y cajón peruano programados para el 17 y 18 de septiembre a las 17:00.',
    startDate: '2026-09-17T17:00:00',
    endDate: '2026-09-18T17:00:00',
    location: 'Casona Cultural',
    address: 'Loja, Ecuador',
    categoryKinds: ['culture'],
    source: 'https://www.loja.gob.ec/evento/2026-09/talleres-de-marinera-y-cajon-peruano',
    organizer: 'Cultura',
  },
  {
    importKey: 'municipio:son-especial-le-canta-a-la-churonita:2026-09-17',
    title: 'Son Especial le Canta a la Churonita',
    description: 'Presentación musical anunciada por el Municipio de Loja para el jueves 17 de septiembre a las 20:00.',
    startDate: '2026-09-17T20:00:00',
    location: 'Iglesia La Catedral',
    address: 'Loja, Ecuador',
    categoryKinds: ['culture', 'concerts'],
    source: 'https://www.loja.gob.ec/evento/2026-09/son-especial-le-canta-la-churonita',
    organizer: 'Cultura',
  },
  {
    importKey: 'municipio:concierto-musica-ecuatoriana:2026-09-19',
    title: 'Concierto de Música Ecuatoriana',
    description: 'Concierto de música ecuatoriana anunciado por el Municipio de Loja para el sábado 19 de septiembre a las 19:00.',
    startDate: '2026-09-19T19:00:00',
    location: 'Teatrino de la Casona Cultural',
    address: 'Loja, Ecuador',
    categoryKinds: ['culture', 'concerts'],
    source: 'https://www.loja.gob.ec/evento/2026-09/concierto-musica-ecuatoriana',
    organizer: 'Cultura',
  },
  {
    importKey: 'municipio:inauguracion-quipu-loja:2026-09-16',
    title: 'Inauguración QUIPU Loja',
    description: 'Inauguración de QUIPU Loja anunciada por el Municipio para el miércoles 16 de septiembre a las 19:00.',
    startDate: '2026-09-16T19:00:00',
    location: 'Teatro Bolívar',
    address: 'Loja, Ecuador',
    categoryKinds: ['culture'],
    source: 'https://www.loja.gob.ec/evento/2026-09/inauguracion-quipu-loja',
    organizer: 'Cultura',
  },
  {
    importKey: 'municipio:pelicula-matilde-hidalgo:2026-09-16',
    title: 'Película Matilde Hidalgo',
    description: 'Proyección de la película Matilde Hidalgo anunciada por el Municipio para el miércoles 16 de septiembre a las 19:00.',
    startDate: '2026-09-16T19:00:00',
    location: 'Teatrino de la Casona Cultural',
    address: 'Loja, Ecuador',
    categoryKinds: ['culture'],
    source: 'https://www.loja.gob.ec/evento/2026-09/pelicula-matilde-hidalgo',
    organizer: 'Cultura',
  },
  {
    importKey: 'municipio:rueda-de-prensa-quipu-loja-2026:2026-09-14',
    title: 'Rueda de Prensa QUIPU Loja 2026',
    description: 'Rueda de prensa de QUIPU Loja 2026 anunciada por el Municipio para el lunes 14 de septiembre a las 11:00.',
    startDate: '2026-09-14T11:00:00',
    location: 'Casona Cultural',
    address: 'Loja, Ecuador',
    categoryKinds: ['culture'],
    source: 'https://www.loja.gob.ec/evento/2026-09/rueda-de-prensa-quipu-loja-2026',
    organizer: 'Cultura',
  },
]

const facebookDrafts: EventDraft[] = [
  {
    importKey: 'facebook:mozart-tras-el-telon:2026-09-18',
    title: 'Mozart tras el telón: Gala Lírica al Empresario Teatral',
    description: 'Gala lírica de la Orquesta Sinfónica de Loja con arias de ópera y la obra “El Empresario Teatral” de Mozart. Dirección de Víctor Hugo López. Participan Olga Vresca y Valeria Pinoargote, sopranos; Francisco Ortega, tenor; y Roy Espinoza, barítono. La publicación indica que el ticket digital se descarga en la aplicación Vívelo.',
    startDate: '2026-09-18T20:00:00',
    location: 'Teatro Benjamín Carrión Mora',
    address: 'Salvador Bustamante Celi y Agustín Carrión Palacios, Loja',
    categoryKinds: ['culture', 'concerts'],
    source: 'https://www.facebook.com/sinfonicaLoja/?locale=es_LA',
    organizer: 'Orquesta Sinfónica de Loja',
    parish: 'San Sebastián',
  },
]

const cinemaSchedule: Record<string, string[]> = {
  '2026-09-14': [
    'La Princesa y la Flor Mágica: 2D 16:20',
    'Tadeo Jones y la Lámpara Maravillosa: 4K 13:40',
    'La Muerte de Robin Hood: 2D 13:50',
    'Coyote vs Acme: LASER 4K 14:00, 16:10; 4K 17:50; 2D 21:00',
    'La Noche del Demonio: Están entre Nosotros: LASER 4K 18:20, 20:30; 4K 15:40',
    'Spider-Man: Un Nuevo Día: 4K 20:00; 2D 18:10',
  ],
  '2026-09-15': [
    'La Princesa y la Flor Mágica: 4K 14:00',
    'Tadeo Jones y la Lámpara Maravillosa: 2D 16:10',
    'La Muerte de Robin Hood: 2D 13:40',
    'Coyote vs Acme: 4K 15:50, 18:00; 2D 21:00',
    'La Noche del Demonio: Están entre Nosotros: LASER 4K 13:50, 16:00, 18:10, 20:20',
    'Spider-Man: Un Nuevo Día: 4K 20:10; 2D 18:10',
  ],
  '2026-09-16': [
    'La Princesa y la Flor Mágica: 4K 14:00',
    'Tadeo Jones y la Lámpara Maravillosa: 2D 16:10',
    'La Muerte de Robin Hood: 2D 13:40',
    'Coyote vs Acme: 4K 15:50, 18:00; 2D 21:00',
    'La Noche del Demonio: Están entre Nosotros: LASER 4K 13:50, 16:00, 18:10, 20:20',
    'Spider-Man: Un Nuevo Día: 4K 20:10; 2D 18:10',
  ],
}

const cinemaMovies = [
  {
    slug: 'la-princesa-y-la-flor-magica',
    title: 'La Princesa y la Flor Mágica',
    genre: 'Animación/Infantil • español • todo público • estreno',
    description: 'El joven rey Benjamín se enamora del retrato de la soberbia princesa Carolina. Al ser rechazado, decide infiltrarse en el castillo disfrazado de jardinero para conquistarla usando la música y las flores.',
    image: 'https://res.cloudinary.com/cinemasloja/image/upload/v1678918023/peliculas/poster-flor.webp',
  },
  {
    slug: 'tadeo-jones-y-la-lampara-maravillosa',
    title: 'Tadeo Jones y la Lámpara Maravillosa',
    genre: 'Animación/Comedia • español • todo público • estreno',
    description: 'Tadeo y Sara son padres de Olimpia, una niña de dos años. Momia, celoso de perder atención, pide un deseo a la lámpara maravillosa de Las mil y una noches para viajar a su juventud.',
    image: 'https://res.cloudinary.com/cinemasloja/image/upload/v1678918023/peliculas/poster-tadeo.webp',
  },
  {
    slug: 'la-muerte-de-robin-hood',
    title: 'La Muerte de Robin Hood',
    genre: 'Aventura/Drama • español • 12 años • estreno',
    description: 'Robin Hood intenta lidiar con sus demonios tras una larga vida de crímenes y asesinatos. Cuando en una sangrienta batalla resulta herido de gravedad, es enviado a un misterioso castillo para que curen sus heridas. Allí conocerá a una mujer que le ofrecerá una última oportunidad de redención.',
    image: 'https://res.cloudinary.com/cinemasloja/image/upload/v1678918023/peliculas/poster-robin.webp',
  },
  {
    slug: 'coyote-vs-acme',
    title: 'Coyote vs Acme',
    genre: 'Animación/Comedia • español • todo público • estreno',
    description: 'Tras décadas de explosiones por productos defectuosos y cansado de caídas al abismo, Wile E. Coyote decide demandar a ACME. El coyote más emblemático junto con el universo de los Looney Toones está decidido a desmantelar un imperio y enfrentar a su implacable CEO.',
    image: 'https://res.cloudinary.com/cinemasloja/image/upload/v1678918023/peliculas/poster-coyote.webp',
  },
  {
    slug: 'la-noche-del-demonio-estan-entre-nosotros',
    title: 'La Noche del Demonio: Están entre Nosotros',
    genre: 'Terror/Sobrenatural • español • 15 años',
    description: 'La franquicia de terror regresa a sus raíces sobrenaturales. Un nuevo protagonista enfrenta apariciones misteriosas que van mucho más allá de los fenómenos clásicos de fantasmas. El mal encuentra nuevas formas de entrar a la realidad.',
    image: 'https://res.cloudinary.com/cinemasloja/image/upload/v1678918023/peliculas/poster-insi.webp',
  },
  {
    slug: 'spider-man-un-nuevo-dia',
    title: 'Spider-Man: Un Nuevo Día',
    genre: 'Acción/Fantástico • español • 12 años',
    description: 'Luchar contra el crimen a tiempo completo como Spider-Man en un mundo que no lo recuerda provoca un cambio en Peter que tal vez no tenga el poder de controlar. Esa transformación podría ser lo único que detenga una nueva amenaza para la ciudad y sus seres queridos.',
    image: 'https://res.cloudinary.com/cinemasloja/image/upload/v1678918023/peliculas/poster-spider.webp',
  },
]

const cinemaDrafts: EventDraft[] = cinemaMovies.map((movie) => ({
  importKey: `cinemas-in:${movie.slug}:2026-09-14-16`,
  title: `Cartelera Cinemas In: ${movie.title}`,
  description: `${movie.description}\n\nGénero y clasificación: ${movie.genre}.\n\nHorarios publicados para Loja del 14 al 16 de septiembre de 2026:\n${Object.entries(cinemaSchedule)
    .map(([date, entries]) => entries.find((entry) => entry.startsWith(`${movie.title}:`)))
    .filter(Boolean)
    .map((entry, index) => `${['Lun 14 sep', 'Mar 15 sep', 'Mié 16 sep'][index]}: ${entry!.replace(`${movie.title}: `, '')}`)
    .join('\n')}`,
  startDate: '2026-09-14T00:00:00',
  endDate: '2026-09-16T23:59:00',
  location: 'Cinemas In Loja',
  address: 'Av. Orillas del Zamora s/n y Guayaquil, Loja',
  image: movie.image,
  categoryKinds: ['culture'],
  source: CINEMA_SOURCE,
}))

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  })
  if (!admin) throw new Error('No se encontró un usuario administrador para crear los borradores.')

  const categoryCandidates: Record<CategoryKind, string[]> = {
    culture: ['cultura-eventos', 'cultura'],
    concerts: ['conciertos'],
    gastronomy: ['gastronomia-eventos', 'gastronomia'],
  }
  const categoryIds = new Map<CategoryKind, string>()

  for (const kind of Object.keys(categoryCandidates) as CategoryKind[]) {
    const categories = await prisma.category.findMany({
      where: { type: 'EVENT', slug: { in: categoryCandidates[kind] } },
      select: { id: true, slug: true },
    })
    const category = categoryCandidates[kind].map((slug) => categories.find((item) => item.slug === slug)).find(Boolean)
    if (category) categoryIds.set(kind, category.id)
  }

  if (!categoryIds.has('culture')) throw new Error('Falta una categoría EVENT para cultura.')

  const clearedStockImages = await prisma.event.updateMany({
    where: {
      content: { contains: 'Identificador de importación: agenda:' },
      image: { contains: 'images.unsplash.com' },
    },
    data: { image: null },
  })

  const drafts = [...agendaDrafts, ...municipioDrafts, ...facebookDrafts, ...cinemaDrafts]
  const created: Array<{ id: string; title: string; slug: string }> = []
  const skipped: Array<{ title: string; reason: string }> = []

  for (const draft of drafts) {
    const duplicate = await prisma.event.findFirst({
      where: {
        OR: [
          { title: draft.title },
          { content: { contains: `Identificador de importación: ${draft.importKey}` } },
        ],
      },
      select: { id: true, title: true },
    })
    if (duplicate) {
      skipped.push({ title: draft.title, reason: `ya existe (${duplicate.id})` })
      continue
    }

    const categoryIdList = Array.from(
      new Set(
        draft.categoryKinds
          .map((kind) => categoryIds.get(kind) ?? categoryIds.get('culture'))
          .filter((id): id is string => Boolean(id)),
      ),
    )
    const content = draft.source === CINEMA_SOURCE
      ? `Fuente principal: [${CINEMA_SOURCE}](${CINEMA_SOURCE})`
      : null

    const event = await prisma.event.create({
      data: {
        title: draft.title,
        slug: await uniqueSlug(draft.title),
        description: draft.description,
        content,
        image: displayableEventImageUrl(draft.image),
        startDate: lojaDate(draft.startDate),
        endDate: draft.endDate ? lojaDate(draft.endDate) : null,
        price: draft.price ?? null,
        location: draft.location,
        address: draft.address ?? null,
        status: 'PENDING',
        featured: false,
        userId: admin.id,
        eventCategories: {
          create: categoryIdList.map((categoryId) => ({ categoryId })),
        },
      },
      select: { id: true, title: true, slug: true },
    })
    created.push(event)
  }

  console.log(JSON.stringify({ admin: admin.email, totalDrafts: drafts.length, clearedStockImages: clearedStockImages.count, created, skipped }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
