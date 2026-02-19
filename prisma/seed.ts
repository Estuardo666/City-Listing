import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const IMG = {
  concert:    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
  concert2:   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  sports:     'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
  marathon:   'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80',
  theater:    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80',
  food:       'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  food2:      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  tech:       'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  business:   'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80',
  cafe:       'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
  cafe2:      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  restaurant2:'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
  bar:        'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80',
  bar2:       'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
  hotel:      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  hotel2:     'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
  shop:       'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
  shop2:      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80',
  yoga:       'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  art:        'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80',
  dance:      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80',
  market:     'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
  night:      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
  cycling:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  startup:    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
  cooking:    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  workshop:   'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  chess:      'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80',
}

async function main() {
  console.log('Seeding database...')

  const admin = await prisma.user.upsert({
    where: { email: 'admin@citylisting.loja' },
    update: {},
    create: { email: 'admin@citylisting.loja', name: 'Admin CityListing', role: 'ADMIN' },
  })

  const eventCats = [
    { name: 'Conciertos',  slug: 'conciertos',  icon: '🎵', color: '#ef4444' },
    { name: 'Deportes',    slug: 'deportes',    icon: '⚽', color: '#22c55e' },
    { name: 'Cultura',     slug: 'cultura',     icon: '🎭', color: '#8b5cf6' },
    { name: 'Gastronomia', slug: 'gastronomia', icon: '🍽️', color: '#f59e0b' },
    { name: 'Tecnologia',  slug: 'tecnologia',  icon: '💻', color: '#3b82f6' },
    { name: 'Negocios',    slug: 'negocios',    icon: '💼', color: '#6b7280' },
  ]
  const venueCats = [
    { name: 'Restaurantes', slug: 'restaurantes', icon: '🍴', color: '#dc2626' },
    { name: 'Bares',        slug: 'bares',        icon: '🍺', color: '#ea580c' },
    { name: 'Cafeterias',   slug: 'cafeterias',   icon: '☕', color: '#a16207' },
    { name: 'Hoteles',      slug: 'hoteles',      icon: '🏨', color: '#0891b2' },
    { name: 'Tiendas',      slug: 'tiendas',      icon: '🛍️', color: '#7c3aed' },
    { name: 'Servicios',    slug: 'servicios',    icon: '🔧', color: '#059669' },
  ]
  const postCats = [
    { name: 'Noticias',    slug: 'noticias',    icon: '📰', color: '#0284c7' },
    { name: 'Guias',       slug: 'guias',       icon: '📖', color: '#16a34a' },
    { name: 'Entrevistas', slug: 'entrevistas', icon: '🎤', color: '#9333ea' },
    { name: 'Opinion',     slug: 'opinion',     icon: '💭', color: '#db2777' },
  ]
  for (const c of eventCats) await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, type: 'EVENT' } })
  for (const c of venueCats) await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, type: 'VENUE' } })
  for (const c of postCats)  await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, type: 'POST' } })
  console.log('Categories seeded')

  type VenueSeed = {
    name: string; slug: string; description: string; content: string; image: string
    location: string; lat: number; lng: number; address: string
    phone?: string; email?: string; website?: string; featured?: boolean; categorySlug: string
  }

  const venues: VenueSeed[] = [
    { name: 'Restaurante El Jardin', slug: 'restaurante-el-jardin', description: 'Comida tradicional lojana en un entorno unico rodeado de jardines.', content: 'El Jardin es sinonimo de sabor autentico. Menu incluye cecina, repe lojano, tamales y los mejores dulces de la region. Ambiente familiar.', image: IMG.restaurant, location: 'Parque Central', lat: -4.0055, lng: -79.2052, address: 'Av. 18 de Noviembre y Sucre, Loja', phone: '+593 7 257-5678', featured: true, categorySlug: 'restaurantes' },
    { name: 'La Parrilla del Rio', slug: 'la-parrilla-del-rio', description: 'Las mejores carnes a la parrilla con vista al rio Malacatos.', content: 'Especialistas en cortes premium y mariscos frescos. Terraza con vista al rio, ideal para almuerzos de negocios y cenas romanticas.', image: IMG.restaurant2, location: 'Ribera del rio Malacatos', lat: -4.0112, lng: -79.2018, address: 'Calle Mercadillo 7-32, Loja', phone: '+593 7 258-9900', categorySlug: 'restaurantes' },
    { name: 'Sazon Lojano', slug: 'sazon-lojano', description: 'Cocina tradicional ecuatoriana con recetas de la abuela.', content: 'Menu del dia con sopa, segundo y jugo desde $3.50. Especialidad en repe lojano y cuy asado los fines de semana.', image: IMG.food2, location: 'Mercado Central', lat: -4.0068, lng: -79.2061, address: 'Calle 18 de Noviembre 5-12, Loja', phone: '+593 7 257-3344', categorySlug: 'restaurantes' },
    { name: 'Pizzeria Napoli', slug: 'pizzeria-napoli', description: 'Pizzas artesanales al horno de lena con ingredientes importados.', content: 'Masa madre, mozzarella fresca y tomates San Marzano. Mas de 20 variedades de pizza y pasta fresca hecha en casa.', image: IMG.food, location: 'Av. Universitaria', lat: -4.0095, lng: -79.2075, address: 'Av. Universitaria 22-10, Loja', phone: '+593 7 258-6677', categorySlug: 'restaurantes' },
    { name: 'Bar La Rumba', slug: 'bar-la-rumba', description: 'Musica en vivo y los mejores tragos los fines de semana.', content: 'La Rumba es el lugar de referencia para la vida nocturna lojana. Musica en vivo jueves, viernes y sabado. Cocteleria artesanal.', image: IMG.bar, location: 'Zona Rosa', lat: -4.0089, lng: -79.2034, address: 'Calle Lazo 8-45, Loja', phone: '+593 7 257-9012', featured: true, categorySlug: 'bares' },
    { name: 'Craft Beer House', slug: 'craft-beer-house', description: 'Bar especializado en cervezas artesanales ecuatorianas e importadas.', content: 'Mas de 30 variedades de cerveza artesanal en grifo y botella. Ambiente relajado, musica indie y tapas para acompanar.', image: IMG.bar2, location: 'Barrio San Sebastian', lat: -4.0045, lng: -79.2038, address: 'Calle Sucre 12-67, Loja', phone: '+593 7 258-4455', categorySlug: 'bares' },
    { name: 'Cevicheria El Puerto', slug: 'cevicheria-el-puerto', description: 'Los mejores ceviches y cocteles de mariscos de Loja.', content: 'Traemos el sabor del mar a la sierra. Ceviche de camaron, mixto, concha y pulpo. Abierto desde el mediodia.', image: IMG.night, location: 'Av. Universitaria', lat: -4.0098, lng: -79.2071, address: 'Av. Universitaria 14-20, Loja', phone: '+593 7 258-1122', categorySlug: 'bares' },
    { name: 'Cafe Loja', slug: 'cafe-loja', description: 'El mejor cafe de la ciudad con ambiente acogedor y vista al parque central.', content: 'Fundado en 1998, Cafe Loja es un punto de encuentro para lojanos y visitantes. Cafe de altura cultivado en las montanas de la provincia.', image: IMG.cafe, location: 'Centro historico de Loja', lat: -4.0079, lng: -79.2045, address: 'Calle Bolivar 10-25, Loja', phone: '+593 7 257-1234', email: 'info@cafeloja.com', website: 'https://cafeloja.com', featured: true, categorySlug: 'cafeterias' },
    { name: 'Cafe Cultura', slug: 'cafe-cultura', description: 'Cafe de especialidad con exposiciones de arte local permanentes.', content: 'Mas que un cafe, un espacio cultural. Exposiciones rotativas de artistas lojanos, talleres de cata de cafe y eventos literarios cada mes.', image: IMG.cafe2, location: 'Centro Cultural', lat: -4.0062, lng: -79.2055, address: 'Calle Colon 9-18, Loja', phone: '+593 7 257-6677', website: 'https://cafecultura.ec', featured: true, categorySlug: 'cafeterias' },
    { name: 'Heladeria La Esquina', slug: 'heladeria-la-esquina', description: 'Helados artesanales y batidos con frutas tropicales de la region.', content: 'Helados de paila hechos a mano con frutas locales: naranjilla, taxo, mora, guanabana. Tradicion lojana desde 1975.', image: IMG.food, location: 'Parque Central', lat: -4.0058, lng: -79.2048, address: 'Calle Bolivar y Sucre, Loja', phone: '+593 7 257-2233', categorySlug: 'cafeterias' },
    { name: 'Hotel Grand Victoria', slug: 'hotel-grand-victoria', description: 'Hotel boutique de lujo en el corazon del centro historico.', content: 'Ubicado en una casona colonial restaurada, el Grand Victoria ofrece 24 habitaciones con decoracion de epoca, spa y restaurante gourmet.', image: IMG.hotel, location: 'Centro historico', lat: -4.0072, lng: -79.2049, address: 'Calle Bolivar 14-80, Loja', phone: '+593 7 257-0000', email: 'reservas@grandvictoria.com', website: 'https://grandvictoria.com', featured: true, categorySlug: 'hoteles' },
    { name: 'Hostal Casa Loja', slug: 'hostal-casa-loja', description: 'Hostal familiar con jardin y desayuno incluido.', content: 'Ambiente familiar y acogedor a 5 minutos del centro. Habitaciones privadas y dormitorios compartidos. Desayuno tipico lojano incluido.', image: IMG.hotel2, location: 'Barrio El Valle', lat: -4.0035, lng: -79.2065, address: 'Calle Imbabura 3-45, Loja', phone: '+593 7 258-3344', categorySlug: 'hoteles' },
    { name: 'Artesanias del Sur', slug: 'artesanias-del-sur', description: 'Tienda de artesanias y souvenirs hechos por artesanos lojanos.', content: 'Sombreros de paja toquilla, tejidos, ceramica, joyeria en plata y recuerdos unicos de Loja. Trabajamos directamente con artesanos locales.', image: IMG.shop, location: 'Centro historico', lat: -4.0065, lng: -79.2042, address: 'Calle Lourdes 14-36, Loja', phone: '+593 7 257-8899', featured: true, categorySlug: 'tiendas' },
    { name: 'Libreria El Saber', slug: 'libreria-el-saber', description: 'La libreria mas completa de Loja con seccion de autores locales.', content: 'Mas de 15,000 titulos disponibles. Seccion especial de autores lojanos y ecuatorianos. Papeleria, utiles escolares y articulos de oficina.', image: IMG.shop2, location: 'Av. Universitaria', lat: -4.0102, lng: -79.2078, address: 'Av. Universitaria 8-90, Loja', phone: '+593 7 258-1100', categorySlug: 'tiendas' },
    { name: 'Centro de Yoga Loja', slug: 'centro-yoga-loja', description: 'Clases de yoga, meditacion y bienestar para todos los niveles.', content: 'Instructores certificados internacionalmente. Clases de hatha yoga, vinyasa, yin yoga y meditacion. Primer mes con 50% de descuento.', image: IMG.yoga, location: 'Barrio San Cayetano', lat: -4.0048, lng: -79.2029, address: 'Calle Azuay 5-67, Loja', phone: '+593 7 258-7788', website: 'https://yogaloja.com', featured: true, categorySlug: 'servicios' },
    { name: 'Estudio Fotografico Luz', slug: 'estudio-fotografico-luz', description: 'Fotografia profesional para eventos, retratos y publicidad.', content: 'Equipo profesional para bodas, quinceaneras, graduaciones y sesiones corporativas. Estudio completamente equipado y servicio a domicilio.', image: IMG.art, location: 'Barrio La Tebaida', lat: -4.0085, lng: -79.2015, address: 'Calle Mercadillo 11-23, Loja', phone: '+593 7 258-5566', categorySlug: 'servicios' },
  ]

  const createdVenues: Record<string, string> = {}
  for (const v of venues) {
    const cat = await prisma.category.findFirst({ where: { slug: v.categorySlug } })
    if (!cat) continue
    const { categorySlug, ...rest } = v
    const venue = await prisma.venue.upsert({
      where: { slug: rest.slug },
      update: { image: rest.image },
      create: { ...rest, userId: admin.id, categoryId: cat.id, status: 'APPROVED', featured: rest.featured ?? false },
    })
    createdVenues[rest.slug] = venue.id
  }
  console.log(`${venues.length} venues seeded`)

  const now = new Date()
  const d = (days: number, hour = 18) => {
    const dt = new Date(now)
    dt.setDate(dt.getDate() + days)
    dt.setHours(hour, 0, 0, 0)
    return dt
  }

  type EventSeed = {
    title: string; slug: string; description: string; content: string; image: string
    startDate: Date; endDate?: Date; location: string; lat: number; lng: number; address: string
    featured?: boolean; categorySlug: string; venueSlug?: string
  }

  const events: EventSeed[] = [
    // Conciertos
    { title: 'Noche de Jazz en el Teatro Benjamin Carrion', slug: 'noche-jazz-teatro-benjamin-carrion', description: 'Una velada unica con los mejores exponentes del jazz ecuatoriano en el teatro mas emblematico de Loja.', content: 'El Cuarteto de Jazz de Loja se une a musicos invitados de Quito y Guayaquil para una noche inolvidable. Repertorio de standards clasicos y composiciones originales. Puertas abren a las 18h30.', image: IMG.concert, startDate: d(3, 19), endDate: d(3, 22), location: 'Teatro Benjamin Carrion', lat: -4.0060, lng: -79.2050, address: 'Calle Bolivar y Rocafuerte, Loja', featured: true, categorySlug: 'conciertos', venueSlug: 'cafe-cultura' },
    { title: 'Festival de Musica Andina Loja 2026', slug: 'festival-musica-andina-loja-2026', description: 'Tres dias de musica andina con artistas de Ecuador, Peru y Bolivia.', content: 'El festival mas importante de musica andina del sur del Ecuador. Escenarios en el parque central y teatro municipal. Entrada libre para todos los asistentes.', image: IMG.concert2, startDate: d(12, 16), endDate: d(14, 22), location: 'Parque Central de Loja', lat: -4.0055, lng: -79.2052, address: 'Av. 18 de Noviembre, Loja', featured: true, categorySlug: 'conciertos', venueSlug: 'restaurante-el-jardin' },
    { title: 'Concierto Acustico: Voces del Sur', slug: 'concierto-acustico-voces-del-sur', description: 'Noche intima con artistas emergentes de la escena musical lojana.', content: 'Cuatro artistas locales presentan sus proyectos solistas en formato acustico intimo. Capacidad limitada a 80 personas. Incluye copa de vino de bienvenida.', image: IMG.night, startDate: d(7, 20), endDate: d(7, 23), location: 'Bar La Rumba', lat: -4.0089, lng: -79.2034, address: 'Calle Lazo 8-45, Loja', categorySlug: 'conciertos', venueSlug: 'bar-la-rumba' },
    // Deportes
    { title: 'Maraton Ciudad de Loja 2026', slug: 'maraton-ciudad-loja-2026', description: 'Corre por las calles historicas de Loja en la maraton mas importante del sur del Ecuador.', content: 'Distancias: 5K, 10K y 21K. Premios para todas las categorias. Hidratacion cada 2.5km. Camiseta y medalla para todos los participantes. Inscripciones en linea.', image: IMG.marathon, startDate: d(20, 6), endDate: d(20, 12), location: 'Plaza de la Independencia', lat: -4.0079, lng: -79.2045, address: 'Plaza de la Independencia, Loja', featured: true, categorySlug: 'deportes' },
    { title: 'Torneo de Futbol Barrial Copa Loja', slug: 'torneo-futbol-barrial-copa-loja', description: 'El torneo de futbol barrial mas esperado del ano con 16 equipos participantes.', content: 'Fase de grupos, octavos, cuartos, semifinales y final. Premios en efectivo para los tres primeros lugares. Inscripciones abiertas hasta el 28 de febrero.', image: IMG.sports, startDate: d(15, 8), endDate: d(45, 18), location: 'Estadio Reina del Cisne', lat: -4.0120, lng: -79.2030, address: 'Av. Cuxibamba, Loja', categorySlug: 'deportes' },
    { title: 'Ciclovia Dominical Loja', slug: 'ciclovia-dominical-loja', description: 'Cada domingo las principales avenidas de Loja se cierran para ciclistas y peatones.', content: 'Recorrido de 8km por el centro historico y ribera del rio. Actividades de yoga, aerobicos y juegos para ninos en los puntos de descanso. Entrada libre.', image: IMG.cycling, startDate: d(4, 7), endDate: d(4, 12), location: 'Av. 18 de Noviembre', lat: -4.0055, lng: -79.2052, address: 'Av. 18 de Noviembre (desde Parque Central), Loja', categorySlug: 'deportes' },
    // Cultura
    { title: 'Exposicion: Arte Contemporaneo Lojano', slug: 'exposicion-arte-contemporaneo-lojano', description: 'Muestra colectiva de 15 artistas plasticos de la provincia de Loja.', content: 'Pintura, escultura, fotografia e instalaciones. Inauguracion con coctel el viernes a las 19h. La exposicion permanece abierta durante tres semanas. Entrada libre.', image: IMG.art, startDate: d(5, 19), endDate: d(26, 20), location: 'Casa de la Cultura Ecuatoriana', lat: -4.0063, lng: -79.2047, address: 'Calle Colon y Bernardo Valdivieso, Loja', featured: true, categorySlug: 'cultura', venueSlug: 'cafe-cultura' },
    { title: 'Obra de Teatro: La Minga', slug: 'obra-teatro-la-minga', description: 'Obra teatral que rescata las tradiciones comunitarias del pueblo lojano.', content: 'El grupo de teatro universitario presenta esta obra de dramaturgia local que explora la identidad cultural lojana a traves de la minga como practica ancestral.', image: IMG.theater, startDate: d(9, 19), endDate: d(9, 21), location: 'Teatro Municipal de Loja', lat: -4.0058, lng: -79.2053, address: 'Calle Bernardo Valdivieso, Loja', categorySlug: 'cultura' },
    { title: 'Festival de Danza Folklorica', slug: 'festival-danza-folklorica-loja', description: 'Grupos de danza de todo el Ecuador se reunen en Loja para celebrar la diversidad cultural.', content: 'Mas de 20 grupos de danza folklorica de todas las regiones del Ecuador. Presentaciones en el parque central y teatro municipal. Entrada libre para todo publico.', image: IMG.dance, startDate: d(18, 15), endDate: d(19, 21), location: 'Parque Central', lat: -4.0055, lng: -79.2052, address: 'Parque Central de Loja', categorySlug: 'cultura' },
    // Gastronomia
    { title: 'Festival Gastronomico Sabores de Loja', slug: 'festival-gastronomico-sabores-loja', description: 'El evento gastronomico mas importante del sur del Ecuador con mas de 40 expositores.', content: 'Degustaciones, concursos de cocina, talleres con chefs reconocidos y muestra de productos locales. Entrada $5, ninos menores de 10 anos gratis.', image: IMG.market, startDate: d(25, 10), endDate: d(27, 20), location: 'Parque La Argelia', lat: -4.0140, lng: -79.2060, address: 'Av. Pio Jaramillo Alvarado, Loja', featured: true, categorySlug: 'gastronomia', venueSlug: 'sazon-lojano' },
    { title: 'Taller de Cocina Tradicional Lojana', slug: 'taller-cocina-tradicional-lojana', description: 'Aprende a preparar los platos mas emblematicos de la gastronomia lojana.', content: 'Repe lojano, cecina, tamales y dulces tipicos. Cupo limitado a 15 personas. Incluye materiales, delantal y recetario. Precio: $25 por persona.', image: IMG.cooking, startDate: d(10, 9), endDate: d(10, 13), location: 'Sazon Lojano', lat: -4.0068, lng: -79.2061, address: 'Calle 18 de Noviembre 5-12, Loja', categorySlug: 'gastronomia', venueSlug: 'sazon-lojano' },
    // Tecnologia
    { title: 'Hackathon Loja Tech 2026', slug: 'hackathon-loja-tech-2026', description: '48 horas para construir soluciones tecnologicas a problemas reales de la ciudad.', content: 'Equipos de 2 a 5 personas. Mentores de empresas tecnologicas nacionales e internacionales. Premios en efectivo y oportunidades de inversion para los mejores proyectos.', image: IMG.tech, startDate: d(30, 8), endDate: d(31, 20), location: 'Universidad Tecnica Particular de Loja', lat: -4.0150, lng: -79.2100, address: 'San Cayetano Alto, Loja', featured: true, categorySlug: 'tecnologia' },
    { title: 'Meetup Desarrolladores de Loja', slug: 'meetup-desarrolladores-loja', description: 'Encuentro mensual de la comunidad de desarrolladores de software de Loja.', content: 'Charlas tecnicas, networking y demos de proyectos locales. Este mes: React 19, IA generativa y casos de uso en startups ecuatorianas. Entrada libre, cupos limitados.', image: IMG.workshop, startDate: d(8, 18), endDate: d(8, 21), location: 'Cafe Cultura', lat: -4.0062, lng: -79.2055, address: 'Calle Colon 9-18, Loja', categorySlug: 'tecnologia', venueSlug: 'cafe-cultura' },
    { title: 'Taller de Inteligencia Artificial para Negocios', slug: 'taller-ia-negocios-loja', description: 'Aprende a usar herramientas de IA para potenciar tu negocio local.', content: 'ChatGPT, Midjourney, automatizacion de procesos y analisis de datos. Dirigido a emprendedores y duenos de negocios. Incluye laptop y materiales digitales.', image: IMG.startup, startDate: d(16, 9), endDate: d(16, 17), location: 'Hotel Grand Victoria - Sala de Eventos', lat: -4.0072, lng: -79.2049, address: 'Calle Bolivar 14-80, Loja', categorySlug: 'tecnologia', venueSlug: 'hotel-grand-victoria' },
    // Negocios
    { title: 'Feria de Emprendimiento Loja Emprende', slug: 'feria-emprendimiento-loja-emprende', description: 'La feria mas importante para emprendedores del sur del Ecuador.', content: 'Mas de 60 stands de emprendimientos locales. Ruedas de negocios, charlas magistrales y concurso de pitch con premios de hasta $5,000. Entrada libre.', image: IMG.business, startDate: d(22, 9), endDate: d(23, 18), location: 'Centro Comercial Portal del Parque', lat: -4.0050, lng: -79.2040, address: 'Av. Universitaria, Loja', featured: true, categorySlug: 'negocios' },
    { title: 'Networking Empresarial Camara de Comercio', slug: 'networking-empresarial-camara-comercio', description: 'Evento de networking para empresarios y profesionales de Loja.', content: 'Conecta con los lideres empresariales de la region. Presentaciones de proyectos de inversion, oportunidades de negocio y cocktail de cierre. Cupos limitados a 100 personas.', image: IMG.chess, startDate: d(11, 18), endDate: d(11, 21), location: 'Hotel Grand Victoria', lat: -4.0072, lng: -79.2049, address: 'Calle Bolivar 14-80, Loja', categorySlug: 'negocios', venueSlug: 'hotel-grand-victoria' },
  ]

  for (const e of events) {
    const cat = await prisma.category.findFirst({ where: { slug: e.categorySlug } })
    if (!cat) continue
    const venueId = e.venueSlug ? createdVenues[e.venueSlug] : undefined
    const { categorySlug, venueSlug, ...rest } = e
    await prisma.event.upsert({
      where: { slug: rest.slug },
      update: { image: rest.image },
      create: { ...rest, userId: admin.id, categoryId: cat.id, venueId, status: 'APPROVED', featured: rest.featured ?? false },
    })
  }
  console.log(`${events.length} events seeded`)

  // Posts
  const BLOG_IMG = {
    music:      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    food:       'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    nightlife:  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    craft:      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
    nature:     'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
    coffee:     'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
    startup:    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
    travel:     'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
    art:        'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80',
    market:     'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
  }

  type PostSeed = {
    title: string; slug: string; excerpt: string; content: string
    image: string; categorySlug: string; featured?: boolean
    status?: string; publishedAt?: Date
  }

  const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d }

  const posts: PostSeed[] = [
    {
      title: 'Loja: La Ciudad Musical del Ecuador',
      slug: 'loja-ciudad-musical-ecuador',
      excerpt: 'Descubre por que Loja es conocida como la cuna de grandes musicos y como la musica define su identidad cultural.',
      content: `Loja no es solo una ciudad hermosa enclavada entre montanas, es el hogar donde nacen las melodias que emocionan al Ecuador entero. Desde el maestro Segundo Luis Moreno hasta los artistas contemporaneos que llenan festivales internacionales, la musica corre por las venas de esta ciudad surena.

El Conservatorio Nacional de Musica de Loja, fundado en 1978, ha formado a generaciones de musicos que hoy brillan en escenarios de todo el mundo. Sus aulas han visto nacer talentos que van desde la musica clasica hasta el jazz contemporaneo.

Cada ano, el Festival Internacional de Musica de Loja reune a artistas de mas de 15 paises. Las calles del centro historico se convierten en escenarios improvisados donde cualquier rincon puede transformarse en un concierto memorable.

Los lojanos tienen una relacion especial con la musica. No es raro escuchar a alguien tararear una melodia mientras camina por el mercado, o encontrar grupos de jovenes ensayando en los parques. La musica aqui no es un entretenimiento, es un estilo de vida.

Si visitas Loja, no te pierdas una noche en el Teatro Benjamin Carrion, donde la acustica perfecta y la programacion de alta calidad te garantizan una experiencia inolvidable.`,
      image: BLOG_IMG.music,
      categorySlug: 'noticias',
      featured: true,
      publishedAt: daysAgo(5),
    },
    {
      title: 'Guia Gastronomica: Lo que Debes Comer en Loja',
      slug: 'guia-gastronomica-loja',
      excerpt: 'Los platos tipicos que no puedes perderte durante tu visita a la capital del sur del Ecuador.',
      content: `La gastronomia lojana es un reflejo de su cultura: autentica, variada y deliciosa. El repe lojano, la cecina, los tamales y el cuy asado son solo el comienzo de una aventura culinaria inigualable que te dejara con ganas de volver.

El Repe Lojano es sin duda el plato emblema de la ciudad. Esta sopa cremosa de guineo verde con queso y cilantro es el desayuno favorito de los lojanos y una experiencia obligatoria para cualquier visitante. Se sirve caliente y reconforta el alma en las mananas frescas de la sierra.

La Cecina es otro tesoro culinario: carne de cerdo marinada con especias locales, secada al sol y luego asada a la parrilla. Se sirve acompanada de yuca, platano maduro y encurtido de cebolla. Es el plato estrella de los almuerzos familiares del domingo.

Los Tamales Lojanos tienen una receta propia que los distingue de los tamales del resto del Ecuador. La masa de maiz suave envuelta en hoja de achira, rellena de pollo, huevo y aceitunas, es una delicia que se prepara especialmente para fiestas y celebraciones.

Para los amantes del dulce, los Dulces de Loja son imperdibles: conservas de higo, dulce de leche, nogadas y los famosos alfajores que se venden en las tiendas del centro historico.

Donde comer: El Mercado Central es el mejor lugar para probar la gastronomia local a precios accesibles. Para una experiencia mas elaborada, Restaurante El Jardin y Sazon Lojano son referencias obligadas.`,
      image: BLOG_IMG.food,
      categorySlug: 'guias',
      featured: true,
      publishedAt: daysAgo(12),
    },
    {
      title: 'Los Mejores Bares y Vida Nocturna de Loja en 2026',
      slug: 'mejores-bares-loja-2026',
      excerpt: 'Una guia completa de la vibrante escena nocturna lojana: desde bares artesanales hasta locales con musica en vivo.',
      content: `Loja tiene una escena nocturna vibrante y en crecimiento que sorprende a quienes visitan la ciudad por primera vez. Lejos de la imagen de ciudad tranquila y academica, los fines de semana revelan una energia festiva que se extiende hasta la madrugada.

Bar La Rumba es el epicentro de la vida nocturna lojana. Con musica en vivo jueves, viernes y sabado, y una cocteleria artesanal que ha ganado premios regionales, este local en la Zona Rosa es el punto de encuentro de jovenes profesionales y artistas locales.

Craft Beer House ha revolucionado la escena con mas de 30 variedades de cerveza artesanal ecuatoriana e importada. El ambiente relajado, la musica indie y las tapas de autor lo convierten en el lugar perfecto para una noche tranquila entre amigos.

La Cevicheria El Puerto, aunque principalmente conocida por su comida, se transforma en bar los fines de semana con cocteles de mariscos que no encontraras en ningun otro lugar de la ciudad.

Cafe Cultura organiza eventos nocturnos de jazz y musica electronica experimental que atraen a un publico mas alternativo. Su terraza con vista al centro historico es uno de los espacios mas fotografiados de Loja.

Consejo: La vida nocturna lojana empieza tarde. Antes de las 22h los bares estan casi vacios. El momento optimo para salir es entre las 23h y la 1h de la madrugada.`,
      image: BLOG_IMG.nightlife,
      categorySlug: 'guias',
      publishedAt: daysAgo(8),
    },
    {
      title: 'Entrevista: El Emprendedor Detras de Artesanias del Sur',
      slug: 'entrevista-artesanias-del-sur',
      excerpt: 'Conversamos con Don Carlos Valdivieso sobre como ha preservado la artesania lojana durante 20 anos.',
      content: `Don Carlos Valdivieso lleva 20 anos trabajando con artesanos locales para llevar la cultura lojana al mundo. En esta entrevista exclusiva nos cuenta sus desafios, logros y vision de futuro para la artesania de la region.

CityListing: Don Carlos, como empezo todo?

Carlos Valdivieso: Empezo por necesidad y amor. Mi padre era artesano, mi abuelo era artesano. Cuando vi que los jovenes ya no querian aprender el oficio, decidi crear un espacio donde el trabajo manual tuviera valor y reconocimiento.

CL: Cual es el mayor desafio que enfrenta la artesania lojana hoy?

CV: La competencia con productos industriales importados. Un sombrero de paja toquilla hecho a mano puede tardar tres dias en fabricarse. Competir en precio con uno fabricado en fabrica es imposible. Por eso trabajamos en el valor de la historia, la autenticidad y la conexion con el artesano.

CL: Como ha cambiado el negocio con las redes sociales?

CV: Completamente. Antes dependiamos del turismo local. Ahora vendemos a coleccionistas en Europa, Estados Unidos y Japon. Instagram nos abrio puertas que nunca imaginamos. Tenemos clientes que vienen especialmente a Loja para conocer a los artesanos y ver como trabajan.

CL: Que le diria a un joven que quiere aprender artesania?

CV: Que es una profesion con futuro. El mundo esta cansado de lo masivo y busca lo autentico. Un buen artesano lojano puede vivir bien de su oficio si sabe como posicionarse. Nosotros ofrecemos talleres gratuitos todos los sabados.`,
      image: BLOG_IMG.craft,
      categorySlug: 'entrevistas',
      publishedAt: daysAgo(20),
    },
    {
      title: 'Ruta Ecologica: Los Mejores Senderos Cerca de Loja',
      slug: 'ruta-ecologica-senderos-loja',
      excerpt: 'Explora la biodiversidad unica del sur del Ecuador con esta guia de senderos y parques naturales cercanos a Loja.',
      content: `La provincia de Loja es un paraiso para los amantes de la naturaleza. Con ecosistemas que van desde el paramo andino hasta el bosque tropical, la biodiversidad de esta region es extraordinaria y poco conocida incluso por los propios ecuatorianos.

El Parque Nacional Podocarpus es la joya de la corona. Declarado Reserva de la Biosfera por la UNESCO, alberga mas de 3,000 especies de plantas, 600 especies de aves y decenas de mamiferos en peligro de extincion. El sendero El Mirador ofrece vistas panoramicas impresionantes y es accesible para caminantes de nivel intermedio.

El Bosque Protector Corazon de Oro, a solo 20 minutos de la ciudad, es perfecto para una escapada de medio dia. Sus cascadas y pozas naturales son ideales para refrescarse despues de la caminata.

La Laguna del Compadre, a 3,800 metros de altitud, es una experiencia mas exigente pero absolutamente recompensante. El paisaje de paramo con sus frailejones gigantes y la laguna de aguas cristalinas es de otro mundo.

Para los ciclistas, la ruta Loja-Vilcabamba ofrece 45 kilometros de descenso con vistas espectaculares al Valle Sagrado. Es considerada una de las mejores rutas de ciclismo de montana del Ecuador.

Recomendacion: Contrata siempre un guia local certificado. Ademas de garantizar tu seguridad, contribuyes directamente a la economia de las comunidades rurales de la region.`,
      image: BLOG_IMG.nature,
      categorySlug: 'guias',
      featured: true,
      publishedAt: daysAgo(3),
    },
    {
      title: 'El Cafe de Loja: Una Historia de Altura',
      slug: 'cafe-loja-historia-altura',
      excerpt: 'Como el cafe de especialidad cultivado en las montanas lojanas esta conquistando los paladares mas exigentes del mundo.',
      content: `A 1,800 metros sobre el nivel del mar, entre niebla y sol, crece uno de los mejores cafes del mundo. El cafe lojano, cultivado en las laderas de la cordillera occidental, ha pasado de ser un producto de consumo local a conquistar los mercados de especialidad mas exigentes de Europa y Norteamerica.

La variedad Typica, introducida en la region hace mas de un siglo, produce granos con caracteristicas unicas: acidez brillante, cuerpo medio y notas de fruta tropical y chocolate que los catadores internacionales describen como excepcionales.

Cafe Loja, fundado en 1998, fue pionero en el movimiento de cafe de especialidad en la region. Su fundador, Marco Aguirre, viajo a Colombia y Costa Rica para aprender las tecnicas de procesamiento que transformarian la calidad del producto local.

Hoy, mas de 200 familias de pequenos productores trabajan bajo estandares de comercio justo y certificacion organica. El precio que reciben por su cafe es tres veces superior al precio de mercado convencional, lo que ha transformado la economia de comunidades rurales que antes vivian en la pobreza.

El proceso de tostado es un arte en si mismo. Cafe Cultura, en el centro de Loja, realiza sesiones de cata abiertas al publico todos los sabados a las 10h. Es una experiencia educativa y sensorial que no te puedes perder.

Donde comprar: Cafe Loja (Calle Bolivar) y Cafe Cultura (Calle Colon) son los mejores lugares para adquirir cafe de especialidad directamente de los productores.`,
      image: BLOG_IMG.coffee,
      categorySlug: 'noticias',
      publishedAt: daysAgo(15),
    },
    {
      title: 'Startups en Loja: El Ecosistema Emprendedor que Nadie Conoce',
      slug: 'startups-ecosistema-emprendedor-loja',
      excerpt: 'Loja esta emergiendo como un hub de innovacion en el sur del Ecuador con startups que estan cambiando la region.',
      content: `Lejos de Quito y Guayaquil, en la ciudad que muchos conocen solo por su musica y gastronomia, esta naciendo un ecosistema emprendedor que podria sorprender a mas de uno. Loja tiene ingredientes que pocas ciudades latinoamericanas pueden ofrecer: universidades de calidad, costo de vida bajo y una comunidad academica comprometida con la innovacion.

La Universidad Tecnica Particular de Loja (UTPL) ha sido el motor principal de este movimiento. Con mas de 100 proyectos de investigacion activos y un centro de emprendimiento que ha incubado 45 startups en los ultimos tres anos, la UTPL es la columna vertebral del ecosistema local.

Entre las startups mas destacadas esta AgroLoja, una plataforma que conecta a pequenos agricultores con compradores en las principales ciudades del Ecuador, eliminando intermediarios y aumentando los ingresos de los productores rurales hasta en un 40%.

TurismoSur es otra historia de exito: una aplicacion movil que ofrece tours virtuales y en persona de los atractivos turisticos de la region sur del Ecuador. En su primer ano de operacion, genero mas de $200,000 en ingresos y empleo a 30 guias locales.

El Hackathon Loja Tech, que se celebra anualmente, ha sido el catalizador de varios de estos proyectos. El evento reune a desarrolladores, disenadoras y emprendedores durante 48 horas para crear soluciones a problemas reales de la ciudad.

El reto principal sigue siendo el acceso a capital. Los fondos de inversion no llegan facilmente a ciudades intermedias. Sin embargo, el gobierno municipal ha creado un fondo de $500,000 para financiar startups locales, lo que podria cambiar el panorama en los proximos anos.`,
      image: BLOG_IMG.startup,
      categorySlug: 'noticias',
      publishedAt: daysAgo(25),
    },
    {
      title: 'Vilcabamba: El Valle de la Longevidad a 45 Minutos de Loja',
      slug: 'vilcabamba-valle-longevidad',
      excerpt: 'Conoce el famoso Valle Sagrado de Vilcabamba, donde sus habitantes viven mas de 100 anos y el tiempo parece detenerse.',
      content: `A solo 45 minutos de Loja por una carretera que serpentea entre montanas verdes, existe un lugar que ha fascinado a cientificos, aventureros y buscadores de paz durante decadas. Vilcabamba, conocido mundialmente como el Valle de la Longevidad, es uno de los destinos mas especiales del Ecuador.

La fama de Vilcabamba comenzó en los anos 70 cuando investigadores descubrieron que un porcentaje inusualmente alto de sus habitantes superaba los 100 anos de edad. Aunque estudios posteriores matizaron estas cifras, la realidad es que la calidad de vida en Vilcabamba es excepcional.

El clima es perfecto: una primavera eterna con temperaturas entre 18 y 24 grados durante todo el ano. El agua de sus rios y vertientes tiene propiedades minerales unicas. El aire limpio, libre de contaminacion industrial, y el ritmo de vida tranquilo completan la formula del bienestar.

Para los visitantes, Vilcabamba ofrece una variedad de actividades: caminatas por senderos que atraviesan bosques nublados, cabalgatas por el valle, yoga y meditacion en retiros especializados, y la posibilidad de simplemente sentarse en la plaza central a ver pasar el tiempo.

La gastronomia local merece mencion especial. Los restaurantes de Vilcabamba ofrecen cocina organica con productos cultivados en la propia comunidad. El jugo de naranjilla con hierba luisa es la bebida emblema del valle.

Como llegar: Buses desde el terminal de Loja cada 30 minutos. El viaje cuesta $1.50 y dura aproximadamente 45 minutos. Tambien puedes contratar un taxi por $15-20 o alquilar una bicicleta para el descenso de regreso.`,
      image: BLOG_IMG.travel,
      categorySlug: 'guias',
      publishedAt: daysAgo(7),
    },
    {
      title: 'Arte Contemporaneo Lojano: Una Escena que Florece',
      slug: 'arte-contemporaneo-lojano-escena',
      excerpt: 'Los artistas plasticos de Loja estan creando obras que dialogan con lo local y lo global desde el sur del Ecuador.',
      content: `En los ultimos cinco anos, Loja ha vivido un renacimiento artistico silencioso pero poderoso. Una nueva generacion de artistas plasticos, formados en la ciudad pero con miradas globales, esta produciendo obras que cuestionan, celebran y reimaginan la identidad lojana.

El colectivo Arte Sur, fundado en 2021, agrupa a 12 artistas de diferentes disciplinas: pintura, escultura, fotografia, instalacion y arte digital. Sus exposiciones colectivas en la Casa de la Cultura Ecuatoriana han atraido a coleccionistas de Quito, Guayaquil y Lima.

Maria Fernanda Rios es quizas la figura mas reconocida de esta nueva escena. Sus pinturas de gran formato, que mezclan tecnicas del muralismo latinoamericano con referencias a la iconografia indigena lojana, han sido exhibidas en galerias de Madrid y Ciudad de Mexico.

El muralismo urbano ha transformado varios barrios de Loja. El proyecto Loja Pinta, impulsado por el municipio, ha convertido mas de 30 paredes en lienzos que narran la historia y la cultura de la ciudad. El barrio San Sebastian concentra la mayor densidad de murales y se ha convertido en destino para amantes del arte urbano.

Cafe Cultura ha sido fundamental en este proceso. Su galeria de arte, que rota exposiciones mensualmente, ofrece a artistas emergentes un espacio de visibilidad sin las barreras economicas de las galerias comerciales.

El mercado del arte lojano todavia es incipiente, pero el interes de coleccionistas externos esta creciendo. Una obra de un artista lojano emergente puede conseguirse hoy por entre $200 y $2,000, precios que los expertos consideran una oportunidad de inversion.`,
      image: BLOG_IMG.art,
      categorySlug: 'entrevistas',
      publishedAt: daysAgo(18),
    },
    {
      title: 'Mercados de Loja: Donde la Ciudad Muestra su Alma',
      slug: 'mercados-loja-alma-ciudad',
      excerpt: 'Los mercados tradicionales de Loja son mucho mas que lugares de compra: son el corazon social y cultural de la ciudad.',
      content: `Si quieres entender una ciudad de verdad, visita sus mercados. En Loja, los mercados son espacios donde el tiempo parece haberse detenido, donde los sabores y aromas cuentan historias de generaciones y donde la vida cotidiana se desarrolla con una autenticidad que ninguna guia turistica puede capturar completamente.

El Mercado Central, ubicado en el corazon del centro historico, es el mas antiguo y concurrido de la ciudad. Desde las 6 de la manana, decenas de vendedoras disponen sus productos con un orden que parece caotico pero esconde una logica perfecta. Las secciones de frutas tropicales, verduras de la sierra, carnes y comidas preparadas se suceden en un laberinto de colores y aromas.

El Mercado Mayorista, en las afueras del centro, es donde los restaurantes y tiendas de la ciudad abastecen sus cocinas. Llegar aqui al amanecer es una experiencia casi mistica: el movimiento de camiones, el regateo entre comerciantes y el olor a tierra humeda de los productos recien llegados del campo crean una atmosfera unica.

La Feria de los Sabados en el barrio El Valle es quizas la mas autentica de todas. Productores rurales de toda la provincia llegan con sus cosechas: papas nativas de colores, quinua organica, miel de abeja, quesos frescos y frutas que no encontraras en ningun supermercado.

Que comprar: Los quesos frescos lojanos son excepcionales. El queso de hoja, envuelto en hojas de platano, tiene un sabor suave y cremoso que es perfecto para acompanar el cafe de la manana. Las conservas de frutas tropicales y las mermeladas artesanales son ideales como souvenirs.

Consejo practico: Lleva efectivo, llega temprano y no tengas prisa. Los mejores productos se agotan antes de las 9 de la manana.`,
      image: BLOG_IMG.market,
      categorySlug: 'guias',
      status: 'PENDING',
    },
  ]

  for (const p of posts) {
    const cat = await prisma.category.findFirst({ where: { slug: p.categorySlug } })
    if (!cat) continue
    const { categorySlug, status, publishedAt, featured, ...rest } = p
    await prisma.post.upsert({
      where: { slug: rest.slug },
      update: { image: rest.image },
      create: {
        ...rest,
        userId: admin.id,
        categoryId: cat.id,
        status: status ?? 'APPROVED',
        featured: featured ?? false,
        publishedAt: publishedAt ?? (status === 'PENDING' ? null : new Date()),
      },
    })
  }
  console.log(`${posts.length} posts seeded`)
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
