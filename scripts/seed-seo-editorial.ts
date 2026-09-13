import { PrismaClient } from '@prisma/client'
import { SEO_EDITORIAL_ARTICLES } from '../src/lib/seo/editorial-content'

const prisma = new PrismaClient()

async function main() {
  const author = await prisma.user.upsert({
    where: { email: 'estuarlito@gmail.com' },
    update: {},
    create: { email: 'estuarlito@gmail.com', name: 'Vive Loja', role: 'ADMIN' },
  })

  const category = await prisma.category.findFirst({
    where: { type: 'POST', OR: [{ slug: 'blog' }, { slug: 'guias' }] },
    orderBy: { name: 'asc' },
  })

  if (!category) {
    throw new Error('No existe una categoría de artículos (POST).')
  }

  for (const article of SEO_EDITORIAL_ARTICLES) {
    const post = await prisma.post.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content.join('\n\n'),
        image: article.image,
        featured: article.featured ?? false,
        status: 'APPROVED',
        publishedAt: new Date(),
        categoryId: category.id,
        userId: author.id,
      },
      create: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content.join('\n\n'),
        image: article.image,
        featured: article.featured ?? false,
        status: 'APPROVED',
        publishedAt: new Date(),
        categoryId: category.id,
        userId: author.id,
      },
    })

    for (const tagName of article.tags) {
      const tagSlug = tagName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: { name: tagName },
        create: { name: tagName, slug: tagSlug },
      })
      await prisma.postTag.upsert({
        where: { postId_tagId: { postId: post.id, tagId: tag.id } },
        update: {},
        create: { postId: post.id, tagId: tag.id },
      })
    }

    console.log(`Publicado: ${article.slug}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
