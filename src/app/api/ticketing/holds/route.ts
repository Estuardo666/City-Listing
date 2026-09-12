import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { createTicketHold } from '@/lib/ticketing'
import { ticketingErrorResponse, requireIdempotencyKey } from '@/lib/ticketing/http'
import { z } from 'zod'

const schema = z.object({
  eventSlug: z.string().trim().min(1).max(160),
  sessionKey: z.string().trim().min(8).max(160),
  items: z.array(z.object({ ticketTypeId: z.string().min(1), quantity: z.number().int().min(1).max(10), eventSeatIds: z.array(z.string().min(1)).max(10).optional() })).min(1).max(50),
})

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' } }, { status: 400 })
    const principal = await getMobilePrincipal(request)
    // The web checkout uses the NextAuth cookie, while the iOS checkout uses
    // its own bearer token. Persist either authenticated identity on the hold
    // so the paid order can appear in the buyer's account later.
    const webSession = principal ? null : await getServerSession(authOptions)
    const buyerUserId = principal?.userId ?? webSession?.user?.id ?? null
    const hold = await createTicketHold({ ...parsed.data, idempotencyKey: requireIdempotencyKey(request), buyerUserId })
    return NextResponse.json({ data: hold }, { status: hold.idempotent ? 200 : 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return ticketingErrorResponse(error) }
}
