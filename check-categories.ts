import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCategories() {
  const categories = await prisma.category.findMany({
    where: { type: 'VENUE' },
    select: { id: true, name: true, slug: true }
  })
  
  console.log('Available categories:')
  categories.forEach(c => console.log(`${c.name} (${c.slug}) - ID: ${c.id}`))
  
  await prisma.$disconnect()
}

checkCategories()
