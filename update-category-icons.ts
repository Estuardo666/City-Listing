import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateCategoryIcons() {
  console.log('Actualizando iconos de subcategorías...')
  
  try {
    // Obtener la categoría padre RESTAURANTES
    const parentCategory = await prisma.category.findUnique({
      where: { slug: 'restaurantes' },
      select: { icon: true }
    })
    
    if (!parentCategory) {
      console.error('❌ No se encontró la categoría padre "restaurantes"')
      return
    }
    
    console.log(`📋 Icono de categoría padre: ${parentCategory.icon}`)
    
    // Actualizar todas las subcategorías de restaurantes con el mismo icono
    const subcategories = await prisma.category.findMany({
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
        slug: true,
        icon: true
      }
    })
    
    console.log(`\n🔄 Encontradas ${subcategories.length} subcategorías para actualizar:`)
    
    for (const category of subcategories) {
      const updated = await prisma.category.update({
        where: { id: category.id },
        data: { icon: parentCategory.icon }
      })
      
      console.log(`✅ "${category.name}" - Icono actualizado: "${category.icon}" → "${updated.icon}"`)
    }
    
    console.log('\n🎉 Actualización de iconos completada!')
    
  } catch (error) {
    console.error('❌ Error durante la actualización:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateCategoryIcons()
