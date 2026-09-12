import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { replaceTicketTypes } from '@/lib/ticketing'
import { ticketingErrorResponse } from '@/lib/ticketing/http'

const typeSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,60}$/),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  kind: z.enum(['GENERAL', 'NUMBERED', 'ASSIGNED_SEAT']),
  priceCents: z.number().int().min(0).max(100000000),
  capacity: z.number().int().min(1).max(10000000).nullable().optional(),
  minPerOrder: z.number().int().min(1).max(10).optional(),
  maxPerOrder: z.number().int().min(1).max(10).optional(),
  salesStartAt: z.coerce.date().nullable().optional(),
  salesEndAt: z.coerce.date().nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
})

const schema = z.object({ types: z.array(typeSchema).min(1).max(100) })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Inicia sesión.' } }, { status: 401 })
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' } }, { status: 400 })
    const { id } = await params
    return NextResponse.json({ data: await replaceTicketTypes(session.user.id, id, parsed.data.types, session.user.role === 'ADMIN') })
  } catch (error) { return ticketingErrorResponse(error) }
}
