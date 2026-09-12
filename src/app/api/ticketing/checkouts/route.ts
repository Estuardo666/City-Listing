import { NextResponse } from 'next/server'
import { createTicketCheckout } from '@/lib/ticketing'
import { ticketingErrorResponse, requireIdempotencyKey } from '@/lib/ticketing/http'
import { z } from 'zod'

const schema = z.object({
  holdToken: z.string().trim().min(20).max(100),
  buyerName: z.string().trim().min(2).max(160),
  buyerEmail: z.string().trim().email().max(254),
  buyerPhone: z.string().trim().min(7).max(30),
  billingDocumentId: z.string().trim().max(30).optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' } }, { status: 400 })
    const result = await createTicketCheckout({ ...parsed.data, idempotencyKey: requireIdempotencyKey(request) })
    return NextResponse.json({ data: result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return ticketingErrorResponse(error) }
}
