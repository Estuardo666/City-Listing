import { prisma } from '@/lib/prisma'

const DEFAULT_JOB_PATH = '/api/internal/ticketing/jobs'

function baseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://viveloja.com'
}

/**
 * Publishes a durable outbox row to QStash. The database row is always the
 * source of truth; when QStash is not configured (local development), the row
 * remains pending and can be drained by the internal worker endpoint.
 */
export async function publishTicketOutbox(outboxId: string): Promise<boolean> {
  const token = process.env.QSTASH_TOKEN
  if (!token || !process.env.TICKETING_JOB_SECRET) return false

  const destination = `${baseUrl()}${DEFAULT_JOB_PATH}`
  const row = await prisma.ticketingOutbox.findUnique({ where: { id: outboxId }, select: { id: true, kind: true, payload: true } })
  if (!row) return false

  const response = await fetch(`https://qstash.upstash.io/v2/publish/${encodeURIComponent(destination)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Upstash-Forward-X-Ticketing-Job': row.kind,
      'Upstash-Forward-X-Ticketing-Outbox': row.id,
      ...(process.env.TICKETING_JOB_SECRET ? { 'Upstash-Forward-X-Ticketing-Secret': process.env.TICKETING_JOB_SECRET } : {}),
    },
    body: JSON.stringify({ outboxId: row.id, kind: row.kind, payload: row.payload }),
    signal: AbortSignal.timeout(10_000),
  })
  return response.ok
}

export async function publishPendingTicketOutbox(limit = 50) {
  const rows = await prisma.ticketingOutbox.findMany({
    where: { status: { in: ['PENDING', 'FAILED'] }, attempts: { lt: 5 }, availableAt: { lte: new Date() } },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true },
  })
  let published = 0
  for (const row of rows) {
    if (await publishTicketOutbox(row.id)) published += 1
  }
  return { found: rows.length, published }
}
