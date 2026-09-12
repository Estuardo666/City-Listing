import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SOURCE_BASE = 'https://nearbyevents.app/events/'

type Draft = {
  sourceSlug: string
  sourceCategory: string
  title: string
  description: string
  fullDescription: string
  startDate: string
  endDate?: string
  price: number | null
  location: string
  address: string | null
  lat: number | null
  lng: number | null
  image: string | null
  organizer: string | null
  contacts: string[]
  categorySlugs: string[]
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

const drafts: Draft[] = [
  {
    sourceSlug: 'showcase-loop-x-cue-dance',
    sourceCategory: 'Música',
    title: 'LOOP X CUE DANCE Evans Groove party',
    description: 'CUE DANCE X LOOP presenta a Evans Groove, DJ y productor nacional de Guayaquil, junto a Lostman, Lem0n y Claudia P. en una noche de música electrónica.',
    fullDescription: `Nos vemos el sábado 12 de septiembre en las instalaciones de @cuedancemusic como Main Event presentando a @evansgroove_ofc, DJ/Productor de Guayaquil - Ecuador, y como after infaltable en @loopmusic.ec para bailar hasta el amanecer.

Su sonido se mueve entre el tech house, el minimal y el deep tech, caracterizado por potentes líneas de bajo, texturas envolventes, ritmos sólidos y voces enérgicas. Su música ha recibido apoyo de sellos como Dacusan, Riboxrecords, Appetite Records y The Pug Records.

Line up: Evans Groove, Lostman, Lem0n y Claudia P.

Entradas: combo 2 fechas $12, preventa $8, entrada Main Event $5 y entrada After $5. La entrada del día del evento figura a $10 y próximamente.

Reservas: 096 401 9649 - 096 403 4649.`,
    startDate: '2026-09-12T22:00:00-05:00',
    price: 5,
    location: 'CUE DANCE / LOOP MUSIC',
    address: 'Pasaje Santiago, Loja, Ecuador',
    lat: -3.991240255473384,
    lng: -79.19986740680228,
    image: 'https://firebasestorage.googleapis.com/v0/b/nearby-events-a3eb0.firebasestorage.app/o/uploads%2FNmFO5Sh7O6U3k12MpPeYnNe6wP33%2F1787793666959_image.jpg?alt=media&token=9cceacc6-fab1-4d68-add1-4baad934fcf4',
    organizer: 'LOOP MUSIC',
    contacts: ['loopparty1@gmail.com', '+593 96 401 9649'],
    categorySlugs: ['conciertos'],
  },
  {
    sourceSlug: 'carrera-baruch-25k-2da-edicion-2026',
    sourceCategory: 'Deportes',
    title: 'Carrera Baruch 25K – 2da Edición 2026',
    description: 'Carrera atlética de 25K en la ruta Zumba – La Balsa, cantón Chinchipe. Categorías Élite, Energía, Fuerza y Leyenda, con $1.890 en premios y sorpresas.',
    fullDescription: `Domingo 13 de septiembre de 2026, 06h00. Punto de partida: redondel de la Chonta, en Zumba. Se recomienda llegar entre media hora y una hora antes.

Categorías: Élite, Energía (16-30 años), Fuerza (31 años en adelante) y Leyenda (61 años en adelante). Hay premios para el primer, segundo y tercer puesto, además de premios sorpresa.

Inscripción: USD 25. Incluye camiseta, bolso kit con productos de auspiciantes, suero oral, medalla al mérito y puntos de hidratación.

Contacto: WhatsApp 0967737357 - 096 948 6920; domysaeth547@gmail.com.`,
    startDate: '2026-09-13T06:00:00-05:00',
    price: 25,
    location: 'Redondel de la Chonta, Zumba',
    address: 'E682, Zumba, Zamora Chinchipe, Ecuador',
    lat: -4.865034920229285,
    lng: -79.13267987670352,
    image: 'https://firebasestorage.googleapis.com/v0/b/nearby-events-a3eb0.firebasestorage.app/o/uploads%2F9my0P8bYKoXMEND3EPK7OZJ4uC83%2F1782833431068_image.jpg?alt=media&token=1e8358d2-0ba5-4d31-80fb-264b26b72110',
    organizer: 'Ángel Saavedra',
    contacts: ['096 948 6920', '096 773 7357', 'domysaeth547@gmail.com'],
    categorySlugs: ['deportes-eventos'],
  },
  {
    sourceSlug: 'camila-f-x-rosas-kicks',
    sourceCategory: 'Música',
    title: 'Camila F x Rosas&Kicks',
    description: 'Fiesta de música electrónica con Camila, DJ de Machala que representa a una nueva generación de artistas de la escena electrónica del Ecuador.',
    fullDescription: `La ficha de NearBy muestra el evento para el sábado 19 de septiembre de 2026, aunque el texto promocional menciona el 29 de septiembre; conviene confirmar la fecha con la organización. Tenemos por primera vez a @camilaapifr, DJ machaleña que representa a una nueva generación de artistas que vienen dando fuerza y personalidad a la escena electrónica del Ecuador.

Con una propuesta cargada de energía, sensibilidad musical y conexión con el público, Camila continúa consolidando su identidad artística y ganando espacio en diferentes escenarios del país.

Secret line up. Preventa earlybird: 2 entradas por $15. Entrada en puerta: $10. Puertas abren a las 21:00.`,
    startDate: '2026-09-19T21:00:00-05:00',
    price: 15,
    location: 'Loja',
    address: null,
    lat: -3.9935619246812664,
    lng: -79.2015791610741,
    image: 'https://firebasestorage.googleapis.com/v0/b/nearby-events-a3eb0.firebasestorage.app/o/uploads%2FMeO9ZRFoDkO6u6D1QigpSIRfbN22%2F1788315551614_event.jpg?alt=media&token=02d8014f-4ac0-4993-846a-05b8829e78fe',
    organizer: 'ROSAS&KICKS',
    contacts: ['rosasnkicks@gmail.com', '593981466388'],
    categorySlugs: ['conciertos'],
  },
  {
    sourceSlug: 'parque-nacional-yacuri',
    sourceCategory: 'Deportes',
    title: 'Parque nacional Yacurí',
    description: 'Excursión a las lagunas de Jimbura y Picachos en el Parque Nacional Yacurí, con transporte, chiva, guianza y fotografía incluidos.',
    fullDescription: `Lagunas de Jimbura y Picachos.

Domingo 20 de septiembre. Salida a las 03h45 desde el Parque del Valle.

Precio: $45. Incluye transporte, chiva, guianza y fotografía.

Recomendaciones: llevar snacks, ropa cómoda y abrigada, poncho de agua, gorra, bloqueador solar, ropa de recambio, calzado adecuado para senderismo y mínimo un litro de agua.`,
    startDate: '2026-09-20T03:45:00-05:00',
    price: 45,
    location: 'Parque del Valle / Parque Nacional Yacurí',
    address: 'Calle Manuel Monteros, Loja, Ecuador',
    lat: -3.9930852221003383,
    lng: -79.20821353506324,
    image: 'https://firebasestorage.googleapis.com/v0/b/nearby-events-a3eb0.firebasestorage.app/o/event-media%2FIG7pIJ6RSuYx1xKJUJDMkpS8FCJ3%2F1787758570016_video.mp4?alt=media&token=d370e152-77bf-457c-9a68-e9d8e22e21cc',
    organizer: 'Calañas Trekking Club',
    contacts: [],
    categorySlugs: ['deportes-eventos', 'naturaleza'],
  },
  {
    sourceSlug: 'cumbre-iliniza-norte',
    sourceCategory: 'Deportes',
    title: 'Cumbre Iliniza norte',
    description: 'Ascenso al Iliniza Norte del 25 al 27 de septiembre, con guianza profesional, equipos completos, refugio, cena, desayuno, permisos y asistencia de guías.',
    fullDescription: `Cumbre Iliniza Norte, 26 y 27 de septiembre. El grupo de Loja sale el viernes 25 de septiembre a las 20:00 desde el Parque del Valle.

Valor: $75 por la cumbre, incluyendo equipos completos, más $40 por el refugio con cena y desayuno. Total: $115. El transporte se coordina por separado.

Incluye guianza profesional, casco, arnés, línea de vida, pernoctación en Parqueadero La Virgen, fotos personales, permisos de ingreso, asistencia permanente de guías, refugio, cena y desayuno.

Itinerario: viaje nocturno Loja - El Chaupi el viernes 25; llegada y logística el sábado 26; campamento en Parqueadero La Virgen; ascenso nocturno y cumbre a 5.126 m el domingo 27, con retorno hacia Loja.`,
    startDate: '2026-09-25T20:00:00-05:00',
    endDate: '2026-09-27T13:00:00-05:00',
    price: 115,
    location: 'Parque del Valle / Iliniza Norte',
    address: 'Calle Manuel Monteros, Loja, Ecuador',
    lat: -3.993031846687975,
    lng: -79.20824531089704,
    image: 'https://firebasestorage.googleapis.com/v0/b/nearby-events-a3eb0.firebasestorage.app/o/uploads%2FIG7pIJ6RSuYx1xKJUJDMkpS8FCJ3%2F1787758938692_image.jpg?alt=media&token=7ea0477c-b71d-4063-8e8e-619785310f10',
    organizer: 'Calañas Trekking Club',
    contacts: [],
    categorySlugs: ['deportes-eventos', 'naturaleza'],
  },
  {
    sourceSlug: 'cue-dance-x-loop',
    sourceCategory: 'Música',
    title: 'CUE DANCE X LOOP Fer Cass Party',
    description: 'CUE DANCE X LOOP presenta a Fer Cass, DJ y productora internacional de Ciudad de México, junto a talento local en una noche de tech house.',
    fullDescription: `Este sábado 03 de octubre llega Fer Cass, DJ y productora internacional desde Ciudad de México, con una propuesta que fusiona la energía del tech house con melodías y elementos inspirados en los sonidos de Medio Oriente y el mundo árabe.

Su música ha cruzado fronteras y la ha llevado a presentarse en diferentes ciudades de México y en una gira internacional por Perú.

Evento principal: sector La Pileta. After: Loop. Fer Cass junto a local support.

Entradas: combo 2 fechas $12, preventa $8, entrada Main Event $5 y entrada After $5.`,
    startDate: '2026-10-03T22:00:00-05:00',
    price: 5,
    location: 'Sector La Pileta / LOOP MUSIC',
    address: 'Pasaje Santiago, Loja, Ecuador',
    lat: -3.991253936886068,
    lng: -79.1998539506702,
    image: 'https://firebasestorage.googleapis.com/v0/b/nearby-events-a3eb0.firebasestorage.app/o/uploads%2FNmFO5Sh7O6U3k12MpPeYnNe6wP33%2F1789078403000_image.jpg?alt=media&token=987b0ef2-d124-4099-9b8f-6fea6b48ce47',
    organizer: 'LOOP MUSIC',
    contacts: ['loopparty1@gmail.com', '+593 96 401 9649'],
    categorySlugs: ['conciertos'],
  },
  {
    sourceSlug: 'laguna-azul-el-altar',
    sourceCategory: 'Deportes',
    title: 'Laguna Azul - El Altar',
    description: 'Trekking a la Laguna Azul y viaje a Baños durante el feriado del 9 de octubre, con camping, guías, fotografías, comidas seleccionadas y permisos incluidos.',
    fullDescription: `Salida desde Loja el jueves 8 de octubre a las 20:00 desde la Terminal Terrestre. Trekking: 9 y 10 de octubre. Regreso: 11 de octubre.

Valor del trekking: $80. El transporte se coordina por separado.

Incluye equipo de camping completo, guías locales certificados, fotografías, cena del día 1, desayuno del día 2, permisos de ingreso a la reserva El Altar, recuerdo y gestión de hospedaje en Baños. No incluye transporte, hospedaje en Baños ni alimentación y actividades adicionales.

Se requiere poncho de agua, botas de caucho, gorro, guantes, bloqueador, bufanda, linterna frontal, zapatos de trekking y ropa adecuada para camping y trekking.`,
    startDate: '2026-10-08T20:00:00-05:00',
    endDate: '2026-10-12T06:00:00-05:00',
    price: 80,
    location: 'Terminal Terrestre de Loja / El Altar',
    address: 'Calle Manuel Monteros, Loja, Ecuador',
    lat: -3.993091304226037,
    lng: -79.20815425904675,
    image: 'https://firebasestorage.googleapis.com/v0/b/nearby-events-a3eb0.firebasestorage.app/o/uploads%2FIG7pIJ6RSuYx1xKJUJDMkpS8FCJ3%2F1787759174517_image.jpg?alt=media&token=38723c09-a5bb-4b83-b92f-c814dbbd13de',
    organizer: 'Calañas Trekking Club',
    contacts: [],
    categorySlugs: ['deportes-eventos', 'naturaleza'],
  },
  {
    sourceSlug: 'chepo-fest',
    sourceCategory: 'Música',
    title: 'CHEPO FEST',
    description: 'Fiesta de inicio de clases organizada por CLB y curada por Paradox, con Xavy y Fabián G.',
    fullDescription: `CLB presenta CHEPO FEST.

Fiesta de inicio de clases con Xavy y Fabián G. Viernes 09 de octubre, 21:00, en Paradox.

Entradas: preventa $5 y día del evento $7.

Line up: Xavy y Fabián G. Curated by Paradox.`,
    startDate: '2026-10-09T21:00:00-05:00',
    price: 5,
    location: 'Paradox',
    address: '10 de Agosto 164-25, Loja, Ecuador',
    lat: -3.9969136525613633,
    lng: -79.19861286878586,
    image: 'https://firebasestorage.googleapis.com/v0/b/nearby-events-a3eb0.firebasestorage.app/o/uploads%2FTpJFMVQjlLRqM05B5CXbTqBLdnl2%2F1789072781529_image.jpg?alt=media&token=12d58a09-1204-4243-8411-c79f26d09895',
    organizer: 'CLB',
    contacts: [],
    categorySlugs: ['conciertos'],
  },
  {
    sourceSlug: 'all-out-vibes-eterlume',
    sourceCategory: 'Música',
    title: 'All out Vibes - Eterlume',
    description: 'Eterlume llega a Loja con una noche de música House, energía y experiencias para compartir, bailar y conectar.',
    fullDescription: `ETERLUME nace como un espacio creado para conectar personas a través de la música, la energía y las experiencias.

Su esencia está en el House, creando noches donde el sonido, la atmósfera y el público se convierten en una sola experiencia.

Este 23 de octubre llega a Loja con una propuesta para quienes disfrutan de la música House y buscan vivir algo diferente.

Entradas: early bird $5, preventa 1 $7 y día del evento $10.`,
    startDate: '2026-10-23T21:00:00-05:00',
    price: 5,
    location: 'Loja',
    address: null,
    lat: null,
    lng: null,
    image: 'https://firebasestorage.googleapis.com/v0/b/nearby-events-a3eb0.firebasestorage.app/o/uploads%2FuJMwXeUTaddb3gD4Fejulftp8C33%2F1788893949068_image.jpg?alt=media&token=7e08f253-801e-4b51-800b-d27d9a5766c4',
    organizer: 'Jhon Román',
    contacts: ['roman23102001@outlook.com'],
    categorySlugs: ['conciertos'],
  },
  {
    sourceSlug: 'canadians',
    sourceCategory: 'Fiesta',
    title: "CANADIAN'S",
    description: 'Fiesta temática de terror y disfraces en Club Mansory, con música, sorpresas y un ambiente escalofriante.',
    fullDescription: `La noche más aterradora del año llega a Club Mansory.

Una experiencia llena de misterio, disfraces, buena música y sorpresas. Ven con tu mejor look y prepárate para una noche de miedo, diversión y muchas sorpresas.

Viernes 30 de octubre, 20:00. Entrada general: $10.`,
    startDate: '2026-10-30T20:00:00-05:00',
    price: 10,
    location: 'Club Mansory',
    address: 'Calle Santa Marianita de Jesús, Loja, Ecuador',
    lat: -4.000746576819078,
    lng: -79.19408798217773,
    image: 'https://firebasestorage.googleapis.com/v0/b/nearby-events-a3eb0.firebasestorage.app/o/uploads%2FbTYJ08sdTSODTNobMMHUTRRJ44v2%2F1788199696973_image.jpg?alt=media&token=a749900b-6e35-4d1a-9940-08255a55ba4b',
    organizer: 'Club Mansory Ec',
    contacts: ['clubmansoryec@gmail.com', '0994211442'],
    categorySlugs: ['vida-social'],
  },
]

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@viveloja.com', role: 'ADMIN' },
    select: { id: true, email: true },
  })
  if (!admin) throw new Error('No se encontró el usuario administrador de Vive Loja.')

  const categories = await prisma.category.findMany({
    where: { type: 'EVENT', slug: { in: [...new Set(drafts.flatMap((draft) => draft.categorySlugs))] } },
    select: { id: true, slug: true },
  })
  const categoryId = new Map(categories.map((category) => [category.slug, category.id]))
  for (const slug of [...new Set(drafts.flatMap((draft) => draft.categorySlugs))]) {
    if (!categoryId.has(slug)) throw new Error(`Falta la categoría de evento ${slug}.`)
  }

  const results: Array<{ title: string; id?: string; slug?: string; status: string; reason?: string }> = []

  for (const draft of drafts) {
    const sourceUrl = `${SOURCE_BASE}${draft.sourceSlug}`
    const sourceMarker = `Fuente original: ${sourceUrl}`
    const duplicate = await prisma.event.findFirst({
      where: {
        OR: [
          { title: draft.title },
          { content: { contains: sourceMarker } },
        ],
      },
      select: { id: true, title: true, slug: true },
    })

    if (duplicate) {
      results.push({ title: draft.title, id: duplicate.id, slug: duplicate.slug, status: 'SKIPPED', reason: `ya existe (${duplicate.title})` })
      continue
    }

    const slug = await uniqueSlug(draft.title)
    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          title: draft.title,
          slug,
          description: draft.description,
          content: null,
          image: draft.image,
          startDate: new Date(draft.startDate),
          endDate: draft.endDate ? new Date(draft.endDate) : null,
          price: draft.price,
          location: draft.location,
          address: draft.address,
          lat: draft.lat,
          lng: draft.lng,
          status: 'APPROVED',
          featured: false,
          userId: admin.id,
        },
        select: { id: true, title: true, slug: true },
      })

      await tx.eventCategory.createMany({
        data: draft.categorySlugs.map((categorySlug) => ({
          eventId: created.id,
          categoryId: categoryId.get(categorySlug)!,
        })),
      })

      return created
    })

    results.push({ title: event.title, id: event.id, slug: event.slug, status: 'CREATED' })
  }

  console.log(JSON.stringify({ admin: admin.email, source: SOURCE_BASE, created: results.filter((item) => item.status === 'CREATED'), skipped: results.filter((item) => item.status === 'SKIPPED') }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
