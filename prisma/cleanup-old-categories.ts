import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create a fresh POST category
  const blogCat = await prisma.category.upsert({
    where: { slug: 'blog' },
    update: {},
    create: { name: 'Blog', slug: 'blog', icon: '📝', color: '#0284c7', type: 'POST' }
  })
  console.log(`POST category ready: ${blogCat.name} (${blogCat.id})`)

  // Find and fix old POST categories
  const oldPostSlugs = ['noticias', 'guias', 'entrevistas', 'opinion']
  for (const slug of oldPostSlugs) {
    const cat = await prisma.category.findUnique({ where: { slug } })
    if (!cat) {
      console.log(`  ${slug}: not found (already deleted)`)
      continue
    }

    // Reassign all posts from this category to blog
    const updateResult = await prisma.$executeRawUnsafe(
      `UPDATE "Post" SET "categoryId" = $1 WHERE "categoryId" = $2`,
      blogCat.id,
      cat.id
    )
    console.log(`  ${slug}: reassigned ${updateResult} posts to blog`)

    // Verify no posts remain
    const remaining = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as count FROM "Post" WHERE "categoryId" = $1`,
      cat.id
    )
    console.log(`  ${slug}: remaining posts = ${remaining[0].count}`)

    // Delete the category
    await prisma.category.delete({ where: { id: cat.id } })
    console.log(`  ${slug}: deleted`)
  }

  const finalCount = await prisma.category.count()
  console.log(`\nFinal categories: ${finalCount}`)
}

main().then(() => prisma.$disconnect())
