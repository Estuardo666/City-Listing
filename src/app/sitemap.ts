import 'server-only'
import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { EVENT_LANDING_PATHS } from '@/lib/seo/event-landings'
import { EDITORIAL_ARTICLE_PATHS } from '@/lib/seo/editorial-content'
import { RANKED_VENUE_ARTICLE_PATHS } from '@/lib/seo/ranked-venue-articles'
import { dedupePublicEvents } from '@/lib/queries/events'

const SITE_URL = 'https://viveloja.com'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const [venues, events, posts, categories] = await Promise.all([
    prisma.venue.findMany({
      where: { status: 'APPROVED', isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.event.findMany({
      where: {
        status: 'APPROVED',
        OR: [{ startDate: { gte: now } }, { endDate: { gte: now } }],
      },
      select: { slug: true, title: true, startDate: true, endDate: true, location: true, address: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.post.findMany({
      where: { status: 'APPROVED' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { type: 'VENUE' },
      select: { slug: true, updatedAt: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const lastModified = now
  const staticRoutes = [
    { path: '', changeFrequency: 'daily' as const, priority: 1 },
    { path: 'explorar', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: 'eventos', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: 'locales', changeFrequency: 'daily' as const, priority: 0.8 },
    { path: 'blog', changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: 'ofertas', changeFrequency: 'daily' as const, priority: 0.7 },
    { path: 'rutas', changeFrequency: 'weekly' as const, priority: 0.6 },
    { path: 'colecciones', changeFrequency: 'weekly' as const, priority: 0.6 },
    { path: 'about', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: 'contact', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: 'planes', changeFrequency: 'weekly' as const, priority: 0.7 },
    ...EVENT_LANDING_PATHS.map((path) => ({ path, changeFrequency: 'hourly' as const, priority: 0.85 })),
    ...[...EDITORIAL_ARTICLE_PATHS, ...RANKED_VENUE_ARTICLE_PATHS].map((path) => ({
      path: `blog/${path}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]

  const entries: MetadataRoute.Sitemap = [
    ...staticRoutes.map((route) => ({
      url: route.path ? `${SITE_URL}/${route.path}` : SITE_URL,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...categories.flatMap((category) => [
      {
        url: `${SITE_URL}/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/mejores/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
    ]),
    ...venues.map((venue) => ({
      url: `${SITE_URL}/locales/${venue.slug}`,
      lastModified: venue.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...dedupePublicEvents(events).map((event) => ({
      url: `${SITE_URL}/eventos/${event.slug}`,
      lastModified: event.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]

  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values())
}
