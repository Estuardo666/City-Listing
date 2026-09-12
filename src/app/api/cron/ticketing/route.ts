import { NextResponse } from 'next/server'
import { expireTicketHolds, processTicketingOutbox } from '@/lib/ticketing'
import { publishPendingTicketOutbox } from '@/lib/ticketing/outbox'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (!secret || authorization !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const expired = await expireTicketHolds()
  const durableQueueConfigured = Boolean(process.env.QSTASH_TOKEN && process.env.TICKETING_JOB_SECRET)
  const published = durableQueueConfigured ? await publishPendingTicketOutbox() : { found: 0, published: 0 }
  let drained = 0
  if (!durableQueueConfigured) {
    const pending = await prisma.ticketingOutbox.findMany({ where: { status: { in: ['PENDING', 'FAILED'] }, attempts: { lt: 5 }, availableAt: { lte: new Date() } }, orderBy: { createdAt: 'asc' }, take: 20, select: { id: true } })
    for (const row of pending) {
      try { await processTicketingOutbox(row.id); drained += 1 } catch { /* row remains retryable */ }
    }
  }
  return NextResponse.json({ data: { expired, published, drained } })
}
