import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const restaurantSubcategories = [
  {
    name: 'Comida Tradicional Lojana',
    slug: 'comida-tradicional-lojana',
    description: 'Restaurantes que sirven platos típicos y tradicionales de Loja',
    color: '#DC2626',
    icon: 'utensils',
    type: 'VENUE'
  },
  {
    name: 'Café y Repostería',
    slug: 'cafe-reposteria',
    description: 'Cafeterías, pastelerías y lugares para tomar café',
    color: '#92400E',
    icon: 'coffee',
    type: 'VENUE'
  },
  {
    name: 'Parrillas y Carnes',
    slug: 'parrillas-carnes',
    description: 'Restaurantes especializados en parrilladas y carnes',
    color: '#B91C1C',
    icon: 'flame',
    type: 'VENUE'
  },
  {
    name: 'Comida Internacional',
    slug: 'comida-internacional',
    description: 'Restaurantes con cocina internacional y especialidades extranjeras',
    color: '#1E40AF',
    icon: 'globe',
    type: 'VENUE'
  },
  {
    name: 'Comida Rápida',
    slug: 'comida-rapida',
    description: 'Hamburgueserías, pizzerías y comida rápida',
    color: '#EA580C',
    icon: 'burger',
    type: 'VENUE'
  },
  {
    name: 'Bares y Cervecerías',
    slug: 'bares-cervecerias',
    description: 'Bares, pubs y cervecerías artesanales',
    color: '#7C3AED',
    icon: 'beer',
    type: 'VENUE'
  },
  {
    name: 'Mariscos y Pescado',
    slug: 'mariscos-pescado',
    description: 'Restaurantes especializados en mariscos y pescado',
    color: '#0891B2',
    icon: 'fish',
    type: 'VENUE'
  }
]

async function createCategories() {
  console.log('Creando subcategorías de restaurantes...')
  
  try {
    for (const category of restaurantSubcategories) {
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
        type: 'VENUE',
        name: {
          contains: 'Comida',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    })
    
    console.log('\n📋 Subcategorías de restaurantes creadas:')
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug}) - ID: ${cat.id}`)
    })
    
  } catch (error) {
    console.error('❌ Error durante la creación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createCategories()
