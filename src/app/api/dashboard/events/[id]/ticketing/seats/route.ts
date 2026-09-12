import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { replaceEventSeatMap } from '@/lib/ticketing'
import { ticketingErrorResponse } from '@/lib/ticketing/http'

const seatSchema = z.object({
  seatKey: z.string().trim().min(1).max(80),
  section: z.string().trim().max(80).nullable().optional(),
  rowLabel: z.string().trim().max(30).nullable().optional(),
  seatNumber: z.string().trim().min(1).max(30),
  x: z.number().finite(),
  y: z.number().finite(),
  ticketTypeId: z.string().min(1).nullable().optional(),
})

const schema = z.object({ name: z.string().trim().min(1).max(120), seats: z.array(seatSchema).min(1).max(5000) })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Inicia sesión.' } }, { status: 401 })
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' } }, { status: 400 })
    const { id } = await params
    return NextResponse.json({ data: await replaceEventSeatMap(session.user.id, id, parsed.data, session.user.role === 'ADMIN') })
  } catch (error) { return ticketingErrorResponse(error) }
}
