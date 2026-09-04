import 'server-only'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { notifyUser } from './send'
import { eventUpdateMessage } from '@/lib/event-update-message'

type EventSnapshot = Parameters<typeof eventUpdateMessage>[0] & { id: string; slug: string }
export async function queueEventUpdate(tx: Prisma.TransactionClient, before: EventSnapshot, after: EventSnapshot) {
  const message = eventUpdateMessage(before, after)
  if (!message) return
  const favorites = await tx.favorite.findMany({ where: { eventId: after.id }, select: { userId: true } })
  await tx.eventUpdateNotice.createMany({ data: [...new Set(favorites.map(f => f.userId))].map(userId => ({
    userId, eventId: after.id, slug: after.slug, ...message,
  })) })
}

/** Leased outbox. Failed transport attempts remain eligible for the next cron. */
export async function drainEventUpdates() {
  const now = new Date()
  const eligible = { deliveredAt: null, OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }] }
  const rows = await prisma.eventUpdateNotice.findMany({ where: eligible, orderBy: { createdAt: 'asc' }, take: 50 })
  for (const row of rows) {
    const claimed = await prisma.eventUpdateNotice.updateMany({ where: { id: row.id, ...eligible }, data: { leaseUntil: new Date(now.getTime() + 300_000) } })
    if (!claimed.count) continue
    const result = await notifyUser(row.userId, { type: 'eventReminders', title: row.title, body: row.body,
      target: { kind: 'event', slug: row.slug }, collapseId: `event-update-${row.id}`, data: { eventId: row.eventId } })
    const completed = result.skipped || (result.push.failed + result.webPush.failed === 0 && result.push.sent + result.webPush.sent > 0)
    await prisma.eventUpdateNotice.update({ where: { id: row.id }, data: completed
      ? { deliveredAt: new Date(), leaseUntil: null } : { leaseUntil: new Date(Date.now() + 300_000) } })
  }
}
