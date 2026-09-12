import { NextResponse } from 'next/server'
import { processTicketingOutbox } from '@/lib/ticketing'

export async function POST(request: Request) {
  const expected = process.env.TICKETING_JOB_SECRET
  if (!expected || request.headers.get('x-ticketing-secret') !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { outboxId?: string } | null
  if (!body?.outboxId) return NextResponse.json({ error: 'Missing outboxId' }, { status: 400 })
  try {
    return NextResponse.json({ data: await processTicketingOutbox(body.outboxId) })
  } catch (error) {
    console.error('[ticketing] job failed', body.outboxId, error)
    return NextResponse.json({ error: 'Job failed' }, { status: 500 })
  }
}
