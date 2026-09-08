import 'server-only'
import { prisma } from '@/lib/prisma'
import { resolveMobileOpenNow } from '@/lib/queries/home-sections'
import { lojaDay } from '@/lib/loja-day'

/** One public contract for web and native. No private collections or draft venues. */
export async function getTodayInLoja(now = new Date()) {
  const day = lojaDay(now)
  const [events, openVenues, routes, collections] = await Promise.all([
    prisma.event.findMany({
      where: { status: 'APPROVED', startDate: { lt: day.end }, OR: [
        { endDate: { gt: now } }, { endDate: null, startDate: { gte: now } },
      ] }, orderBy: [{ startDate: 'asc' }, { id: 'asc' }], take: 8,
      select: { id: true, title: true, slug: true, image: true, location: true, startDate: true, price: true },
    }),
    resolveMobileOpenNow(now),
    prisma.route.findMany({ where: { status: 'APPROVED', days: 1, estimatedMinutes: { lte: 180, gt: 0 }, stops: { some: {} } },
      orderBy: [{ featured: 'desc' }, { id: 'asc' }], take: 6,
      select: { id: true, title: true, slug: true, image: true, estimatedMinutes: true } }),
    prisma.collection.findMany({ where: { isPublic: true, user: { role: 'ADMIN' }, items: {
      some: { venue: { status: 'APPROVED', isActive: true } },
      every: { venue: { status: 'APPROVED', isActive: true } },
    } }, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }], take: 6,
      select: { id: true, name: true, slug: true, description: true, updatedAt: true,
        user: { select: { name: true } }, items: { orderBy: { order: 'asc' }, take: 1,
          select: { venue: { select: { image: true } } } }, _count: { select: { items: true } } } }),
  ])
  return {
    date: day.date, timeZone: 'America/Guayaquil', generatedAt: now.toISOString(),
    events: events.map(e => ({ id: e.id, kind: 'event' as const, title: e.title, slug: e.slug, image: e.image,
      subtitle: e.location, startDate: e.startDate.toISOString(), price: e.price })),
    openVenues: openVenues.filter(v => v.excludedFromOpenNowDefault !== true).slice(0, 8).map(v => ({
      id: v.id, kind: 'venue' as const, title: v.title, slug: v.slug, image: v.imageUrl ?? null, subtitle: v.subtitle ?? null,
    })),
    routes: routes.map(r => ({ id: r.id, kind: 'route' as const, title: r.title, slug: r.slug, image: r.image,
      subtitle: `${r.estimatedMinutes} min` })),
    collections: collections.map(c => ({ id: c.id, kind: 'collection' as const, title: c.name, slug: c.slug,
      image: c.items[0]?.venue?.image ?? null, subtitle: c.description, author: c.user.name,
      itemCount: c._count.items, updatedAt: c.updatedAt.toISOString() })),
  }
}
