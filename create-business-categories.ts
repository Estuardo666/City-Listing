import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const businessCategories = [
  {
    name: 'Supermercados',
    slug: 'supermercados',
    description: 'Grandes superficies de venta de alimentos y productos de consumo',
    color: '#4CAF50',
    icon: '🛒',
    type: 'VENUE'
  },
  {
    name: 'Salud y Medicina',
    slug: 'salud-y-medicina',
    description: 'Clínicas, hospitales, farmacias y servicios de salud',
    color: '#F44336',
    icon: '🏥',
    type: 'VENUE'
  },
  {
    name: 'Bancos y Finanzas',
    slug: 'bancos-y-finanzas',
    description: 'Instituciones financieras, bancos y cooperativas de crédito',
    color: '#2196F3',
    icon: '🏦',
    type: 'VENUE'
  },
  {
    name: 'Entretenimiento',
    slug: 'entretenimiento',
    description: 'Cines, teatros y lugares de entretenimiento',
    color: '#9C27B0',
    icon: '🎬',
    type: 'VENUE'
  },
  {
    name: 'Industria',
    slug: 'industria',
    description: 'Fábricas e industrias manufactureras',
    color: '#FF9800',
    icon: '🏭',
    type: 'VENUE'
  },
  {
    name: 'Educación',
    slug: 'educacion',
    description: 'Universidades, colegios y centros educativos',
    color: '#009688',
    icon: '🎓',
    type: 'VENUE'
  },
  {
    name: 'Cultura',
    slug: 'cultura',
    description: 'Museos, centros culturales y eventos artísticos',
    color: '#795548',
    icon: '🎭',
    type: 'VENUE'
  },
  {
    name: 'Compras y Tiendas',
    slug: 'compras-y-tiendas',
    description: 'Centros comerciales, micromercados y tiendas locales',
    color: '#E91E63',
    icon: '🛍️',
    type: 'VENUE'
  },
  {
    name: 'Servicios Públicos',
    slug: 'servicios-publicos',
    description: 'Empresas de servicios públicos y utilidades',
    color: '#607D8B',
    icon: '⚡',
    type: 'VENUE'
  },
  {
    name: 'Transporte',
    slug: 'transporte',
    description: 'Terminales de transporte y servicios de movilidad',
    color: '#3F51B5',
    icon: '🚌',
    type: 'VENUE'
  },
  {
    name: 'Gobierno',
    slug: 'gobierno',
    description: 'Instituciones gubernamentales y oficinas públicas',
    color: '#FF5722',
    icon: '🏛️',
    type: 'VENUE'
  },
  {
    name: 'Deportes y Fitness',
    slug: 'deportes-y-fitness',
    description: 'Gimnasios, centros deportivos y actividades físicas',
    color: '#8BC34A',
    icon: '💪',
    type: 'VENUE'
  },
  {
    name: 'Vehículos y Automotores',
    slug: 'vehiculos-y-automotores',
    description: 'Concesionarios, importadoras y talleres automotrices',
    color: '#FFC107',
    icon: '🚗',
    type: 'VENUE'
  },
  {
    name: 'Construcción y Hogar',
    slug: 'construccion-y-hogar',
    description: 'Ferreterías, materiales de construcción y mejoras del hogar',
    color: '#795548',
    icon: '🔨',
    type: 'VENUE'
  },
  {
    name: 'Telecomunicaciones',
    slug: 'telecomunicaciones',
    description: 'Empresas de telefonía, internet y servicios de comunicación',
    color: '#673AB7',
    icon: '📱',
    type: 'VENUE'
  },
  {
    name: 'Retail y Tiendas',
    slug: 'retail-y-tiendas',
    description: 'Tiendas por departamento y retail comercial',
    color: '#FF6B6B',
    icon: '🏪',
    type: 'VENUE'
  },
  {
    name: 'Medios de Comunicación',
    slug: 'medios-de-comunicacion',
    description: 'Radios, televisiones y medios de comunicación local',
    color: '#424242',
    icon: '📻',
    type: 'VENUE'
  },
  {
    name: 'Mercados',
    slug: 'mercados',
    description: 'Mercados tradicionales y mayoristas',
    color: '#FF9800',
    icon: '🏪',
    type: 'VENUE'
  },
  {
    name: 'ONG y Organizaciones',
    slug: 'ong-y-organizaciones',
    description: 'Organizaciones no gubernamentales y sin fines de lucro',
    color: '#00BCD4',
    icon: '🤝',
    type: 'VENUE'
  },
  {
    name: 'Alimentos y Bebidas',
    slug: 'alimentos-y-bebidas',
    description: 'Heladerías, panaderías y negocios de alimentos',
    color: '#D32F2F',
    icon: '🍦',
    type: 'VENUE'
  },
  {
    name: 'Turismo',
    slug: 'turismo',
    description: 'Sitios turísticos, parques y atracciones locales',
    color: '#4CAF50',
    icon: '🗺️',
    type: 'VENUE'
  },
  {
    name: 'Recreación',
    slug: 'recreacion',
    description: 'Parques recreativos, zoológicos y áreas de esparcimiento',
    color: '#8BC34A',
    icon: '🎠',
    type: 'VENUE'
  }
]

async function createCategories() {
  console.log('Creando categorías de negocios...')
  
  try {
    for (const category of businessCategories) {
      // Verificar si ya existe
      const existing = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: category.slug },
            { name: category.name }
          ]
        }
      })
      
      if (existing) {
        console.log(`⚠️  La categoría "${category.name}" ya existe, omitiendo...`)
        continue
      }
      
      // Crear la categoría
      const created = await prisma.category.create({
        data: category
      })
      
      console.log(`✅ Categoría "${category.name}" creada con ID: ${created.id}`)
    }
    
    console.log('🎉 Creación de categorías completada!')
    
    // Mostrar todas las categorías creadas
    const categories = await prisma.category.findMany({
      where: {
        type: 'VENUE'
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log('\n📋 Todas las categorías de venues:')
    categories.forEach(cat => {
      console.log(`- ${cat.icon} ${cat.name} (${cat.slug}) - ID: ${cat.id}`)
    })
    
  } catch (error) {
    console.error('❌ Error durante la creación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createCategories()
