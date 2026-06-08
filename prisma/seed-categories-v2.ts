import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type CategorySeed = {
  name: string
  slug: string
  icon: string
  color: string
  type: 'VENUE' | 'EVENT'
  subcategories: { name: string; slug: string; icon?: string }[]
}

const VENUE_CATEGORIES: CategorySeed[] = [
  {
    name: 'Gastronomía', slug: 'gastronomia', icon: '🍔', color: '#ef4444', type: 'VENUE',
    subcategories: [
      { name: 'Restaurantes', slug: 'restaurantes', icon: '🍴' },
      { name: 'Comida Tradicional', slug: 'comida-tradicional', icon: '🍲' },
      { name: 'Comida Internacional', slug: 'comida-internacional', icon: '🌍' },
      { name: 'Comida Rápida', slug: 'comida-rapida', icon: '🍔' },
      { name: 'Parrillas', slug: 'parrillas', icon: '🥩' },
      { name: 'Mariscos', slug: 'mariscos', icon: '🦐' },
      { name: 'Pizzerías', slug: 'pizzerias', icon: '🍕' },
      { name: 'Hamburgueserías', slug: 'hamburgueserias', icon: '🍔' },
      { name: 'Cafeterías', slug: 'cafeterias', icon: '☕' },
      { name: 'Café y Repostería', slug: 'cafe-reposteria', icon: '🧁' },
      { name: 'Panaderías', slug: 'panaderias', icon: '🥖' },
      { name: 'Pastelerías', slug: 'pastelerias', icon: '🎂' },
      { name: 'Bares', slug: 'bares', icon: '🍺' },
      { name: 'Cervecerías', slug: 'cervecerias', icon: '🍻' },
      { name: 'Wine Bar', slug: 'wine-bar', icon: '🍷' },
      { name: 'Coctelerías', slug: 'coctelerias', icon: '🍸' },
      { name: 'Food Trucks', slug: 'food-trucks', icon: '🚚' },
      { name: 'Heladerías', slug: 'heladerias', icon: '🍦' },
      { name: 'Delivery', slug: 'delivery', icon: '🛵' },
      { name: 'Take Away', slug: 'take-away', icon: '🥡' },
    ],
  },
  {
    name: 'Alojamiento', slug: 'alojamiento', icon: '🏨', color: '#0891b2', type: 'VENUE',
    subcategories: [
      { name: 'Hoteles', slug: 'hoteles', icon: '🏨' },
      { name: 'Hostales', slug: 'hostales', icon: '🏠' },
      { name: 'Hosterías', slug: 'hosterias', icon: '🏡' },
      { name: 'Resorts', slug: 'resorts', icon: '🏖️' },
      { name: 'Apartamentos Turísticos', slug: 'apartamentos-turisticos', icon: '🏢' },
      { name: 'Camping', slug: 'camping', icon: '⛺' },
    ],
  },
  {
    name: 'Turismo', slug: 'turismo', icon: '🌎', color: '#16a34a', type: 'VENUE',
    subcategories: [
      { name: 'Agencias de Viaje', slug: 'agencias-de-viaje', icon: '✈️' },
      { name: 'Operadores Turísticos', slug: 'operadores-turisticos', icon: '🗺️' },
      { name: 'Tours', slug: 'tours', icon: '🚶' },
      { name: 'Atracciones Turísticas', slug: 'atracciones-turisticas', icon: '🎡' },
      { name: 'Centros Recreativos', slug: 'centros-recreativos', icon: '🎠' },
      { name: 'Parques', slug: 'parques', icon: '🌳' },
      { name: 'Miradores', slug: 'miradores', icon: '👁️' },
      { name: 'Turismo Rural', slug: 'turismo-rural', icon: '🌾' },
    ],
  },
  {
    name: 'Compras', slug: 'compras', icon: '🛍️', color: '#7c3aed', type: 'VENUE',
    subcategories: [
      { name: 'Tiendas', slug: 'tiendas', icon: '🏪' },
      { name: 'Moda y Ropa', slug: 'moda-y-ropa', icon: '👗' },
      { name: 'Calzado', slug: 'calzado', icon: '👟' },
      { name: 'Accesorios', slug: 'accesorios', icon: '👜' },
      { name: 'Joyerías', slug: 'joyerias', icon: '💎' },
      { name: 'Electrodomésticos', slug: 'electrodomesticos', icon: '📺' },
      { name: 'Tecnología', slug: 'tecnologia-tienda', icon: '💻' },
      { name: 'Librerías', slug: 'librerias', icon: '📚' },
      { name: 'Jugueterías', slug: 'jugueterias', icon: '🧸' },
      { name: 'Flores y Regalos', slug: 'flores-y-regalos', icon: '💐' },
      { name: 'Centros Comerciales', slug: 'centros-comerciales', icon: '🏬' },
      { name: 'Supermercados', slug: 'supermercados', icon: '🛒' },
      { name: 'Mercados', slug: 'mercados', icon: '🏪' },
      { name: 'Retail', slug: 'retail', icon: '🏪' },
      { name: 'Ferreterías', slug: 'ferreterias', icon: '🔧' },
      { name: 'Mueblerías', slug: 'mueblerias', icon: '🛋️' },
      { name: 'Decoración', slug: 'decoracion', icon: '🖼️' },
    ],
  },
  {
    name: 'Salud y Bienestar', slug: 'salud-bienestar', icon: '🏥', color: '#dc2626', type: 'VENUE',
    subcategories: [
      { name: 'Hospitales', slug: 'hospitales', icon: '🏥' },
      { name: 'Clínicas', slug: 'clinicas', icon: '🏨' },
      { name: 'Centros Médicos', slug: 'centros-medicos', icon: '🏥' },
      { name: 'Médicos', slug: 'medicos', icon: '👨‍⚕️' },
      { name: 'Dentistas', slug: 'dentistas', icon: '🦷' },
      { name: 'Laboratorios', slug: 'laboratorios', icon: '🔬' },
      { name: 'Farmacias', slug: 'farmacias', icon: '💊' },
      { name: 'Ópticas', slug: 'opticas', icon: '👓' },
      { name: 'Gimnasios', slug: 'gimnasios', icon: '🏋️' },
      { name: 'Crossfit', slug: 'crossfit', icon: '💪' },
      { name: 'Yoga', slug: 'yoga', icon: '🧘' },
      { name: 'Spa', slug: 'spa', icon: '🧖' },
      { name: 'Centros Estéticos', slug: 'centros-esteticos', icon: '💆' },
      { name: 'Nutrición', slug: 'nutricion', icon: '🥗' },
      { name: 'Fisioterapia', slug: 'fisioterapia', icon: '🦴' },
    ],
  },
  {
    name: 'Educación', slug: 'educacion', icon: '🎓', color: '#3b82f6', type: 'VENUE',
    subcategories: [
      { name: 'Escuelas', slug: 'escuelas', icon: '🏫' },
      { name: 'Colegios', slug: 'colegios', icon: '🏫' },
      { name: 'Universidades', slug: 'universidades', icon: '🎓' },
      { name: 'Institutos', slug: 'institutos', icon: '🏛️' },
      { name: 'Academias', slug: 'academias', icon: '📖' },
      { name: 'Idiomas', slug: 'idiomas', icon: '🗣️' },
      { name: 'Capacitación', slug: 'capacitacion', icon: '📋' },
      { name: 'Bibliotecas', slug: 'bibliotecas', icon: '📚' },
      { name: 'Centros Educativos', slug: 'centros-educativos', icon: '🏫' },
    ],
  },
  {
    name: 'Cultura', slug: 'cultura', icon: '🎭', color: '#8b5cf6', type: 'VENUE',
    subcategories: [
      { name: 'Museos', slug: 'museos', icon: '🏛️' },
      { name: 'Galerías', slug: 'galerias', icon: '🖼️' },
      { name: 'Centros Culturales', slug: 'centros-culturales', icon: '🎭' },
      { name: 'Teatros', slug: 'teatros', icon: '🎪' },
      { name: 'Arte', slug: 'arte', icon: '🎨' },
      { name: 'Danza', slug: 'danza', icon: '💃' },
      { name: 'Literatura', slug: 'literatura', icon: '📖' },
      { name: 'Patrimonio', slug: 'patrimonio', icon: '🏰' },
    ],
  },
  {
    name: 'Entretenimiento', slug: 'entretenimiento', icon: '🎬', color: '#ec4899', type: 'VENUE',
    subcategories: [
      { name: 'Cines', slug: 'cines', icon: '🎬' },
      { name: 'Discotecas', slug: 'discotecas', icon: '🪩' },
      { name: 'Night Clubs', slug: 'night-clubs', icon: '🌃' },
      { name: 'Salas de Juegos', slug: 'salas-de-juegos', icon: '🎮' },
      { name: 'Parques Temáticos', slug: 'parques-tematicos', icon: '🎢' },
      { name: 'Zoológicos', slug: 'zoologicos', icon: '🦁' },
      { name: 'Acuarios', slug: 'acuarios', icon: '🐠' },
      { name: 'Karaoke', slug: 'karaoke', icon: '🎤' },
      { name: 'Música en Vivo', slug: 'musica-en-vivo', icon: '🎵' },
      { name: 'Eventos Sociales', slug: 'eventos-sociales', icon: '🎉' },
    ],
  },
  {
    name: 'Deportes', slug: 'deportes', icon: '⚽', color: '#22c55e', type: 'VENUE',
    subcategories: [
      { name: 'Complejos Deportivos', slug: 'complejos-deportivos', icon: '🏟️' },
      { name: 'Canchas', slug: 'canchas', icon: '⚽' },
      { name: 'Fútbol', slug: 'futbol', icon: '⚽' },
      { name: 'Basket', slug: 'basket', icon: '🏀' },
      { name: 'Tenis', slug: 'tenis', icon: '🎾' },
      { name: 'Pádel', slug: 'padel', icon: '🏓' },
      { name: 'Natación', slug: 'natacion', icon: '🏊' },
      { name: 'Running', slug: 'running', icon: '🏃' },
      { name: 'Ciclismo', slug: 'ciclismo', icon: '🚴' },
      { name: 'Artes Marciales', slug: 'artes-marciales', icon: '🥋' },
      { name: 'Escuelas Deportivas', slug: 'escuelas-deportivas', icon: '🏫' },
    ],
  },
  {
    name: 'Automotriz y Transporte', slug: 'automotriz-transporte', icon: '🚗', color: '#f59e0b', type: 'VENUE',
    subcategories: [
      { name: 'Concesionarios', slug: 'concesionarios', icon: '🚗' },
      { name: 'Venta de Vehículos', slug: 'venta-de-vehiculos', icon: '🚙' },
      { name: 'Motos', slug: 'motos', icon: '🏍️' },
      { name: 'Talleres', slug: 'talleres', icon: '🔧' },
      { name: 'Mecánica', slug: 'mecanica', icon: '🔩' },
      { name: 'Lavado', slug: 'lavado', icon: '🚿' },
      { name: 'Repuestos', slug: 'repuestos', icon: '⚙️' },
      { name: 'Gasolineras', slug: 'gasolineras', icon: '⛽' },
      { name: 'Carga Eléctrica', slug: 'carga-electrica', icon: '🔌' },
      { name: 'Alquiler de Vehículos', slug: 'alquiler-de-vehiculos', icon: '🔑' },
      { name: 'Transporte', slug: 'transporte', icon: '🚌' },
      { name: 'Taxis', slug: 'taxis', icon: '🚕' },
    ],
  },
  {
    name: 'Gobierno e Instituciones', slug: 'gobierno-instituciones', icon: '🏛️', color: '#6b7280', type: 'VENUE',
    subcategories: [
      { name: 'Gobierno', slug: 'gobierno', icon: '🏛️' },
      { name: 'Municipios', slug: 'municipios', icon: '🏢' },
      { name: 'Instituciones Públicas', slug: 'instituciones-publicas', icon: '🏛️' },
      { name: 'Servicios Públicos', slug: 'servicios-publicos', icon: '⚡' },
      { name: 'Justicia', slug: 'justicia', icon: '⚖️' },
      { name: 'Notarías', slug: 'notarias', icon: '📜' },
      { name: 'Registros', slug: 'registros', icon: '📋' },
      { name: 'Embajadas', slug: 'embajadas', icon: '🏳️' },
      { name: 'ONG', slug: 'ong', icon: '🤝' },
    ],
  },
  {
    name: 'Empresas y Servicios', slug: 'empresas-servicios', icon: '💼', color: '#6366f1', type: 'VENUE',
    subcategories: [
      { name: 'Servicios Profesionales', slug: 'servicios-profesionales', icon: '👔' },
      { name: 'Consultoría', slug: 'consultoria', icon: '📊' },
      { name: 'Marketing', slug: 'marketing', icon: '📢' },
      { name: 'Publicidad', slug: 'publicidad', icon: '📣' },
      { name: 'Diseño', slug: 'diseno', icon: '🎨' },
      { name: 'Desarrollo Web', slug: 'desarrollo-web', icon: '💻' },
      { name: 'Software', slug: 'software', icon: '🖥️' },
      { name: 'Coworking', slug: 'coworking', icon: '🏢' },
      { name: 'Centros de Negocios', slug: 'centros-de-negocios', icon: '🏬' },
      { name: 'Contabilidad', slug: 'contabilidad', icon: '🧮' },
      { name: 'Legal', slug: 'legal', icon: '⚖️' },
      { name: 'Seguros', slug: 'seguros', icon: '🛡️' },
      { name: 'Telecomunicaciones', slug: 'telecomunicaciones', icon: '📱' },
      { name: 'Industria', slug: 'industria', icon: '🏭' },
      { name: 'Construcción', slug: 'construccion', icon: '🏗️' },
      { name: 'Medios de Comunicación', slug: 'medios-de-comunicacion', icon: '📻' },
      { name: 'Funerarias', slug: 'funerarias', icon: '⚰️' },
    ],
  },
  {
    name: 'Finanzas', slug: 'finanzas', icon: '🏦', color: '#1e40af', type: 'VENUE',
    subcategories: [
      { name: 'Bancos', slug: 'bancos', icon: '🏦' },
      { name: 'Cooperativas', slug: 'cooperativas', icon: '🤝' },
      { name: 'ATM', slug: 'atm', icon: '🏧' },
      { name: 'Inversiones', slug: 'inversiones', icon: '📈' },
      { name: 'Créditos', slug: 'creditos', icon: '💳' },
      { name: 'Fintech', slug: 'fintech', icon: '📲' },
      { name: 'Casas de Cambio', slug: 'casas-de-cambio', icon: '💱' },
    ],
  },
  {
    name: 'Mascotas', slug: 'mascotas', icon: '🐾', color: '#059669', type: 'VENUE',
    subcategories: [
      { name: 'Veterinarias', slug: 'veterinarias', icon: '🐾' },
      { name: 'Pet Shops', slug: 'pet-shops', icon: '🐶' },
      { name: 'Grooming', slug: 'grooming', icon: '✂️' },
      { name: 'Adiestramiento', slug: 'adiestramiento', icon: '🦮' },
      { name: 'Guarderías', slug: 'guarderias', icon: '🏠' },
    ],
  },
  {
    name: 'Belleza', slug: 'belleza', icon: '💄', color: '#ec4899', type: 'VENUE',
    subcategories: [
      { name: 'Peluquerías', slug: 'peluquerias', icon: '💇' },
      { name: 'Barberías', slug: 'barberias', icon: '💈' },
      { name: 'Centros Estéticos', slug: 'centros-esteticos-belleza', icon: '💅' },
      { name: 'Uñas', slug: 'unas', icon: '💅' },
      { name: 'Maquillaje', slug: 'maquillaje', icon: '💄' },
      { name: 'Spa', slug: 'spa-belleza', icon: '🧖' },
    ],
  },
  {
    name: 'Inmobiliaria', slug: 'inmobiliaria', icon: '🏠', color: '#78716c', type: 'VENUE',
    subcategories: [
      { name: 'Bienes Raíces', slug: 'bienes-raices', icon: '🏠' },
      { name: 'Constructoras', slug: 'constructoras', icon: '🏗️' },
      { name: 'Corredores', slug: 'corredores', icon: '🤝' },
      { name: 'Alquileres', slug: 'alquileres', icon: '🔑' },
      { name: 'Proyectos Inmobiliarios', slug: 'proyectos-inmobiliarios', icon: '📐' },
    ],
  },
]

const EVENT_CATEGORIES: CategorySeed[] = [
  {
    name: 'Conciertos', slug: 'conciertos', icon: '🎵', color: '#ef4444', type: 'EVENT',
    subcategories: [
      { name: 'Rock', slug: 'rock', icon: '🎸' },
      { name: 'Pop', slug: 'pop', icon: '🎤' },
      { name: 'Electrónica', slug: 'electronica', icon: '🎧' },
      { name: 'Salsa', slug: 'salsa', icon: '💃' },
      { name: 'Cumbia', slug: 'cumbia', icon: '🎶' },
      { name: 'Folclore', slug: 'folclore', icon: '🪘' },
      { name: 'Jazz', slug: 'jazz', icon: '🎷' },
      { name: 'Reggaeton', slug: 'reggaeton', icon: '🔊' },
      { name: 'Metal', slug: 'metal', icon: '🤘' },
      { name: 'Tributos', slug: 'tributos', icon: '🎭' },
      { name: 'Música en Vivo', slug: 'musica-en-vivo-evento', icon: '🎵' },
    ],
  },
  {
    name: 'Cultura', slug: 'cultura-eventos', icon: '🎭', color: '#8b5cf6', type: 'EVENT',
    subcategories: [
      { name: 'Teatro', slug: 'teatro', icon: '🎭' },
      { name: 'Danza', slug: 'danza-evento', icon: '💃' },
      { name: 'Exposiciones', slug: 'exposiciones', icon: '🖼️' },
      { name: 'Museos', slug: 'museos-evento', icon: '🏛️' },
      { name: 'Literatura', slug: 'literatura-evento', icon: '📖' },
      { name: 'Poesía', slug: 'poesia', icon: '📝' },
      { name: 'Arte', slug: 'arte-evento', icon: '🎨' },
      { name: 'Patrimonio', slug: 'patrimonio-evento', icon: '🏰' },
      { name: 'Festivales Culturales', slug: 'festivales-culturales', icon: '🎪' },
    ],
  },
  {
    name: 'Deportes', slug: 'deportes-eventos', icon: '⚽', color: '#22c55e', type: 'EVENT',
    subcategories: [
      { name: 'Fútbol', slug: 'futbol-evento', icon: '⚽' },
      { name: 'Basket', slug: 'basket-evento', icon: '🏀' },
      { name: 'Running', slug: 'running-evento', icon: '🏃' },
      { name: 'Ciclismo', slug: 'ciclismo-evento', icon: '🚴' },
      { name: 'Natación', slug: 'natacion-evento', icon: '🏊' },
      { name: 'Artes Marciales', slug: 'artes-marciales-evento', icon: '🥋' },
      { name: 'Tenis', slug: 'tenis-evento', icon: '🎾' },
      { name: 'Pádel', slug: 'padel-evento', icon: '🏓' },
      { name: 'eSports', slug: 'esports', icon: '🎮' },
    ],
  },
  {
    name: 'Gastronomía', slug: 'gastronomia-eventos', icon: '🍔', color: '#f59e0b', type: 'EVENT',
    subcategories: [
      { name: 'Ferias', slug: 'ferias-gastro', icon: '🎪' },
      { name: 'Food Trucks', slug: 'food-trucks-evento', icon: '🚚' },
      { name: 'Festivales', slug: 'festivales-gastro', icon: '🎉' },
      { name: 'Degustaciones', slug: 'degustaciones', icon: '🍷' },
      { name: 'Catas', slug: 'catas', icon: '🧀' },
      { name: 'Cocina Local', slug: 'cocina-local', icon: '🍲' },
      { name: 'Cocina Internacional', slug: 'cocina-internacional-evento', icon: '🌍' },
    ],
  },
  {
    name: 'Tecnología', slug: 'tecnologia', icon: '💻', color: '#3b82f6', type: 'EVENT',
    subcategories: [
      { name: 'IA', slug: 'ia', icon: '🤖' },
      { name: 'Programación', slug: 'programacion', icon: '💻' },
      { name: 'Startups', slug: 'startups', icon: '🚀' },
      { name: 'Marketing Digital', slug: 'marketing-digital', icon: '📢' },
      { name: 'Blockchain', slug: 'blockchain', icon: '⛓️' },
      { name: 'Ciberseguridad', slug: 'ciberseguridad', icon: '🔒' },
      { name: 'Desarrollo Web', slug: 'desarrollo-web-evento', icon: '🌐' },
      { name: 'UX/UI', slug: 'ux-ui', icon: '🎨' },
    ],
  },
  {
    name: 'Negocios', slug: 'negocios', icon: '💼', color: '#6b7280', type: 'EVENT',
    subcategories: [
      { name: 'Networking', slug: 'networking', icon: '🤝' },
      { name: 'Emprendimiento', slug: 'emprendimiento', icon: '🚀' },
      { name: 'Conferencias', slug: 'conferencias', icon: '🎤' },
      { name: 'Capacitaciones', slug: 'capacitaciones', icon: '📋' },
      { name: 'Ferias Comerciales', slug: 'ferias-comerciales', icon: '🏪' },
      { name: 'Inversiones', slug: 'inversiones-evento', icon: '📈' },
      { name: 'Ventas', slug: 'ventas', icon: '💰' },
    ],
  },
  {
    name: 'Familia', slug: 'familia', icon: '👨‍👩‍👧', color: '#ec4899', type: 'EVENT',
    subcategories: [
      { name: 'Infantiles', slug: 'infantiles', icon: '👶' },
      { name: 'Educativos', slug: 'educativos', icon: '📚' },
      { name: 'Mascotas', slug: 'mascotas-evento', icon: '🐾' },
      { name: 'Comunitarios', slug: 'comunitarios', icon: '🏘️' },
      { name: 'Vacacionales', slug: 'vacacionales', icon: '🏖️' },
    ],
  },
  {
    name: 'Vida Social', slug: 'vida-social', icon: '🎉', color: '#f97316', type: 'EVENT',
    subcategories: [
      { name: 'Ferias', slug: 'ferias-social', icon: '🎪' },
      { name: 'Festivales', slug: 'festivales', icon: '🎉' },
      { name: 'Celebraciones', slug: 'celebraciones', icon: '🎊' },
      { name: 'Comunidades', slug: 'comunidades', icon: '👥' },
      { name: 'Meetups', slug: 'meetups', icon: '🤝' },
      { name: 'Eventos Benéficos', slug: 'eventos-beneficos', icon: '❤️' },
    ],
  },
  {
    name: 'Educación', slug: 'educacion-eventos', icon: '🎓', color: '#3b82f6', type: 'EVENT',
    subcategories: [
      { name: 'Cursos', slug: 'cursos', icon: '📖' },
      { name: 'Talleres', slug: 'talleres', icon: '🔨' },
      { name: 'Masterclass', slug: 'masterclass', icon: '🎓' },
      { name: 'Bootcamps', slug: 'bootcamps', icon: '💻' },
      { name: 'Seminarios', slug: 'seminarios', icon: '📋' },
      { name: 'Certificaciones', slug: 'certificaciones', icon: '📜' },
    ],
  },
  {
    name: 'Gobierno y Comunidad', slug: 'gobierno-comunidad', icon: '🏛️', color: '#6b7280', type: 'EVENT',
    subcategories: [
      { name: 'Participación Ciudadana', slug: 'participacion-ciudadana', icon: '🗳️' },
      { name: 'Cabildos', slug: 'cabildos', icon: '🏛️' },
      { name: 'Asambleas', slug: 'asambleas', icon: '👥' },
      { name: 'Eventos Municipales', slug: 'eventos-municipales', icon: '🏢' },
      { name: 'Eventos Institucionales', slug: 'eventos-institucionales', icon: '🏛️' },
    ],
  },
  {
    name: 'Religión y Espiritualidad', slug: 'religion', icon: '🙏', color: '#a855f7', type: 'EVENT',
    subcategories: [
      { name: 'Misas', slug: 'misas', icon: '⛪' },
      { name: 'Congresos', slug: 'congresos-religiosos', icon: '🎤' },
      { name: 'Retiros', slug: 'retiros', icon: '🏔️' },
      { name: 'Encuentros', slug: 'encuentros', icon: '🤝' },
      { name: 'Celebraciones Religiosas', slug: 'celebraciones-religiosas', icon: '🙏' },
    ],
  },
  {
    name: 'Naturaleza', slug: 'naturaleza', icon: '🌿', color: '#16a34a', type: 'EVENT',
    subcategories: [
      { name: 'Senderismo', slug: 'senderismo', icon: '🥾' },
      { name: 'Campamento', slug: 'campamento', icon: '⛺' },
      { name: 'Ecoturismo', slug: 'ecoturismo', icon: '🌿' },
      { name: 'Observación de Aves', slug: 'observacion-de-aves', icon: '🐦' },
      { name: 'Tours Ecológicos', slug: 'tours-ecologicos', icon: '🌳' },
    ],
  },
]

export async function seedCategoriesV2() {
  console.log('Seeding categories v2...')

  const allCategories = [...VENUE_CATEGORIES, ...EVENT_CATEGORIES]

  for (const catData of allCategories) {
    const { subcategories, ...categoryFields } = catData

    const category = await prisma.category.upsert({
      where: { slug: categoryFields.slug },
      update: {
        name: categoryFields.name,
        icon: categoryFields.icon,
        color: categoryFields.color,
        type: categoryFields.type,
      },
      create: categoryFields,
    })

    for (const subData of subcategories) {
      await prisma.subcategory.upsert({
        where: { slug: subData.slug },
        update: {
          name: subData.name,
          icon: subData.icon || null,
          categoryId: category.id,
        },
        create: {
          name: subData.name,
          slug: subData.slug,
          icon: subData.icon || null,
          categoryId: category.id,
        },
      })
    }

    console.log(`  ${category.type === 'VENUE' ? '🏪' : '🎫'} ${category.name}: ${subcategories.length} subcategories`)
  }

  const catCount = await prisma.category.count()
  const subCount = await prisma.subcategory.count()
  console.log(`Total: ${catCount} categories, ${subCount} subcategories`)
}

seedCategoriesV2()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
