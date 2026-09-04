import 'server-only'
import { createHmac } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function recordSave(tx: Prisma.TransactionClient, favoriteId: string, kind: string, itemId: string, source: string) {
  await tx.interactionEvent.create({ data: { dedupeKey: `save:${favoriteId}`, action: 'save', kind, itemId, source } })
}

/** Count intent, not physical visits. One click per item/source/viewer/30-minute bucket. */
export async function recordDirections(request: Request, kind: 'venue' | 'event' | 'route', itemId: string, source: 'web' | 'ios' | 'android') {
  const found = kind === 'venue'
    ? await prisma.venue.count({ where: { id: itemId, status: 'APPROVED', isActive: true } })
    : kind === 'event' ? await prisma.event.count({ where: { id: itemId, status: 'APPROVED' } })
      : await prisma.route.count({ where: { id: itemId, status: 'APPROVED' } })
  if (!found) return { found: false, recorded: false }
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return { found: true, recorded: false }
  const bucket = Math.floor(Date.now() / 1800_000)
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  // Rotates every bucket; neither raw addresses nor coordinates are stored.
  const dedupeKey = createHmac('sha256', secret).update(`${bucket}:${address}:${request.headers.get('user-agent')}:${kind}:${itemId}:${source}`).digest('hex')
  const result = await prisma.interactionEvent.createMany({ data: [{ dedupeKey, action: 'directions', kind, itemId, source }], skipDuplicates: true })
  return { found: true, recorded: result.count === 1 }
}

export async function getInteractionMetrics(kind: string, itemId: string) {
  const grouped = await prisma.interactionEvent.groupBy({ by: ['action', 'source'],
    where: { kind, itemId, createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } }, _count: { _all: true } })
  return { days: 30, saves: grouped.filter(r => r.action === 'save').reduce((n, r) => n + r._count._all, 0),
    directions: grouped.filter(r => r.action === 'directions').reduce((n, r) => n + r._count._all, 0),
    bySource: grouped.map(r => ({ action: r.action, source: r.source, count: r._count._all })) }
}
