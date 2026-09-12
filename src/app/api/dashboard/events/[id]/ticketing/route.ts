import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { configureEventTicketing, getManagedEventTicketing } from '@/lib/ticketing'
import { ticketingErrorResponse } from '@/lib/ticketing/http'

const schema = z.object({
  mode: z.enum(['NONE', 'INTERNAL', 'EXTERNAL']),
  sellerType: z.enum(['PLATFORM', 'ORGANIZER']).optional(),
  paymentAccountId: z.string().min(1).nullable().optional(),
  externalUrl: z.string().trim().url().nullable().optional(),
  externalProviderLabel: z.string().trim().max(100).nullable().optional(),
  feeIncidence: z.enum(['NONE', 'BUYER_PAYS', 'ORGANIZER_ABSORBS']).optional(),
  feePercentBps: z.number().int().min(0).max(10000).optional(),
  feeFixedCents: z.number().int().min(0).max(100000).optional(),
  salesStartAt: z.coerce.date().nullable().optional(),
  salesEndAt: z.coerce.date().nullable().optional(),
  status: z.enum(['DRAFT', 'READY', 'ON_SALE', 'PAUSED', 'ENDED']).optional(),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Inicia sesión.' } }, { status: 401 })
    const { id } = await params
    return NextResponse.json({ data: await getManagedEventTicketing(session.user.id, id, session.user.role === 'ADMIN') }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return ticketingErrorResponse(error) }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Inicia sesión.' } }, { status: 401 })
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' } }, { status: 400 })
    const { id } = await params
    const config = await configureEventTicketing(session.user.id, id, parsed.data, session.user.role === 'ADMIN')
    return NextResponse.json({ data: config })
  } catch (error) { return ticketingErrorResponse(error) }
}
