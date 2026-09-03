import 'server-only'

import { createHash } from 'node:crypto'

import { redis, withCache } from '@/lib/cache'
import { prisma } from '@/lib/prisma'

/**
 * View recording, shared by the web Server Action and the mobile endpoint.
 *
 * Before this, the two surfaces counted differently: the app incremented
 * `viewCount` with no dedupe while the site had its own path, and neither left
 * a timestamp, so "popular now" could only ever mean "popular ever".
 */

export const VIEW_KINDS = ['venue', 'event', 'post', 'watchEvent', 'route', 'collection'] as const
export type ViewKind = (typeof VIEW_KINDS)[number]

export type ViewSource = 'web' | 'pwa' | 'ios' | 'android'

/** One viewer counts once per item per window. */
const DEDUPE_WINDOW_SECONDS = 30 * 60
/** Rows older than this are dropped by the cron. */
export const VIEW_RETENTION_DAYS = 30

/** Stable per-viewer id that stores no personal data. */
export function anonymousViewerId(request: Request): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const agent = request.headers.get('user-agent') ?? 'unknown'
  return createHash('sha256').update(`${ip}:${agent}`).digest('hex').slice(0, 32)
}

async function shouldCount(kind: ViewKind, itemId: string, viewer: string): Promise<boolean> {
  if (!process.env.KV_REST_API_URL) return true
  try {
    const key = `view:${kind}:${itemId}:${viewer}`
    const attempts = await redis.incr(key)
    if (attempts === 1) {
      await redis.expire(key, DEDUPE_WINDOW_SECONDS)
      return true
    }
    return false
  } catch {
    // Without Redis the counter is looser rather than broken.
    return true
  }
}

/**
 * Increments the lifetime counter and appends a timestamped row.
 *
 * Returns `false` when the same viewer already counted inside the dedupe
 * window, so callers can tell a duplicate from a missing item.
 */
export async function recordView(input: {
  kind: ViewKind
  itemId: string
  userId?: string | null
  viewerId: string
  source: ViewSource
}): Promise<{ counted: boolean; found: boolean }> {
  const viewer = input.userId ?? input.viewerId
  const counted = await shouldCount(input.kind, input.itemId, viewer)

  const found = await incrementLifetimeCounter(input.kind, input.itemId)
  if (!found) return { counted: false, found: false }
  if (!counted) return { counted: false, found: true }

  await prisma.viewEvent.create({
    data: {
      kind: input.kind,
      itemId: input.itemId,
      userId: input.userId ?? null,
      anonId: input.userId ? null : input.viewerId,
      source: input.source,
    },
  })

  return { counted: true, found: true }
}

async function incrementLifetimeCounter(kind: ViewKind, itemId: string): Promise<boolean> {
  const data = { viewCount: { increment: 1 } }

  switch (kind) {
    case 'venue': {
      const result = await prisma.venue.updateMany({
        where: { id: itemId, status: 'APPROVED', isActive: true },
        data,
      })
      return result.count === 1
    }
    case 'event': {
      const result = await prisma.event.updateMany({ where: { id: itemId, status: 'APPROVED' }, data })
      return result.count === 1
    }
    case 'post': {
      const result = await prisma.post.updateMany({ where: { id: itemId, status: 'APPROVED' }, data })
      return result.count === 1
    }
    case 'watchEvent': {
      const result = await prisma.watchEvent.updateMany({ where: { id: itemId, status: 'ACTIVE' }, data })
      return result.count === 1
    }
    // Routes and collections have no lifetime counter column; the timestamped
    // row is the whole record for them.
    case 'route':
      return (await prisma.route.count({ where: { id: itemId, status: 'APPROVED' } })) === 1
    case 'collection':
      return (await prisma.collection.count({ where: { id: itemId, isPublic: true } })) === 1
  }
}

export type PopularWindow = '24h' | '7d'

const WINDOW_HOURS: Record<PopularWindow, number> = { '24h': 24, '7d': 24 * 7 }

/**
 * Most viewed items of a window, newest data wins. Cached for five minutes:
 * "popular now" does not have to be to-the-second, and the group-by is the most
 * expensive read on the home screen.
 */
export async function getPopularNow(input: {
  kind: ViewKind
  window?: PopularWindow
  limit?: number
}): Promise<Array<{ itemId: string; views: number }>> {
  const window = input.window ?? '24h'
  const limit = Math.min(input.limit ?? 10, 50)

  return withCache(
    `popular:${input.kind}:${window}:${limit}`,
    async () => {
      const since = new Date(Date.now() - WINDOW_HOURS[window] * 60 * 60 * 1000)
      const grouped = await prisma.viewEvent.groupBy({
        by: ['itemId'],
        where: { kind: input.kind, createdAt: { gte: since } },
        _count: { itemId: true },
        orderBy: { _count: { itemId: 'desc' } },
        take: limit,
      })

      return grouped.map((row) => ({ itemId: row.itemId, views: row._count.itemId }))
    },
    300,
  )
}

/** Per-day view counts for one item, used by the business dashboard. */
export async function getViewSeries(input: {
  kind: ViewKind
  itemId: string
  days?: number
}): Promise<Array<{ date: string; views: number }>> {
  const days = Math.min(input.days ?? 30, VIEW_RETENTION_DAYS)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const rows = await prisma.viewEvent.findMany({
    where: { kind: input.kind, itemId: input.itemId, createdAt: { gte: since } },
    select: { createdAt: true },
    take: 50_000,
  })

  const buckets = new Map<string, number>()
  for (const row of rows) {
    const date = row.createdAt.toISOString().slice(0, 10)
    buckets.set(date, (buckets.get(date) ?? 0) + 1)
  }

  return [...buckets.entries()]
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
