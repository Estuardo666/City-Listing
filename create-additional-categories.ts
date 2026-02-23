import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const additionalCategories = [
  {
    name: 'Moda y Ropa',
    slug: 'moda-y-ropa',
    description: 'Tiendas de ropa, boutiques y moda local',
    color: '#E91E63',
    icon: '👗',
    type: 'VENUE'
  },
  {
    name: 'Electrodomésticos y Tecnología',
    slug: 'electrodomesticos-y-tecnologia',
    description: 'Tiendas de electrodomésticos, tecnología y artículos para el hogar',
    color: '#3F51B5',
    icon: '📺',
    type: 'VENUE'
  },
  {
    name: 'Calzado y Accesorios',
    slug: 'calzado-y-accesorios',
    description: 'Tiendas de calzado, zapaterías y accesorios de moda',
    color: '#795548',
    icon: '👟',
    type: 'VENUE'
  },
  {
    name: 'Funerarias y Servicios Fúnebres',
    slug: 'funerarias-y-servicios-funebres',
    description: 'Funerarias, servicios funerarios y cementerios',
    color: '#607D8B',
    icon: '⚰️',
    type: 'VENUE'
  },
  {
    name: 'Notarías y Servicios Legales',
    slug: 'notarias-y-servicios-legales',
    description: 'Notarías, abogados y servicios legales',
    color: '#FF9800',
    icon: '⚖️',
    type: 'VENUE'
  },
  {
    name: 'Flores y Regalos',
    slug: 'flores-y-regalos',
    description: 'Florerías, tiendas de regalos y artículos para celebraciones',
    color: '#4CAF50',
    icon: '💐',
    type: 'VENUE'
  },
  {
    name: 'Centros Educativos Privados',
    slug: 'centros-educativos-privados',
    description: 'Colegios, institutos y centros educativos privados',
    color: '#9C27B0',
    icon: '🏫',
    type: 'VENUE'
  },
  {
    name: 'Centros Médicos Privados',
    slug: 'centros-medicos-privados',
    description: 'Clínicas, consultorios y centros médicos privados',
    color: '#F44336',
    icon: '🏥',
    type: 'VENUE'
  }
]

async function createAdditionalCategories() {
  console.log('Creando categorías adicionales...')
  
  try {
    for (const category of additionalCategories) {
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
    
    console.log('🎉 Creación de categorías adicionales completada!')
    
  } catch (error) {
    console.error('❌ Error durante la creación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdditionalCategories()
