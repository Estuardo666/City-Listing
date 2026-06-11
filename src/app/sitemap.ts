import 'server-only'
import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const SITE_URL = 'https://viveloja.com'
const PAGE_SIZE = 5000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [venueCount, eventCount, postCount, watchEventCount] = await Promise.all([
    prisma.venue.count({ where: { status: 'APPROVED', isActive: true } }),
    prisma.event.count({ where: { status: 'APPROVED' } }),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.watchEvent.count({ where: { status: 'ACTIVE' } }),
  ])

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/sitemaps/static`, lastModified: new Date() },
    { url: `${SITE_URL}/sitemaps/categorias`, lastModified: new Date() },
    { url: `${SITE_URL}/sitemaps/colecciones`, lastModified: new Date() },
  ]

  const localesPages = Math.max(1, Math.ceil(venueCount / PAGE_SIZE))
  for (let i = 1; i <= localesPages; i++) {
    entries.push({
      url: `${SITE_URL}/sitemaps/locales?page=${i}`,
      lastModified: new Date(),
    })
  }

  const eventosPages = Math.max(1, Math.ceil(eventCount / PAGE_SIZE))
  for (let i = 1; i <= eventosPages; i++) {
    entries.push({
      url: `${SITE_URL}/sitemaps/eventos?page=${i}`,
      lastModified: new Date(),
    })
  }

  const blogPages = Math.max(1, Math.ceil(postCount / PAGE_SIZE))
  for (let i = 1; i <= blogPages; i++) {
    entries.push({
      url: `${SITE_URL}/sitemaps/blog?page=${i}`,
      lastModified: new Date(),
    })
  }

  if (watchEventCount > 0) {
    const watchPages = Math.max(1, Math.ceil(watchEventCount / PAGE_SIZE))
    for (let i = 1; i <= watchPages; i++) {
      entries.push({
        url: `${SITE_URL}/sitemaps/partidos?page=${i}`,
        lastModified: new Date(),
      })
    }
  }

  return entries
}
