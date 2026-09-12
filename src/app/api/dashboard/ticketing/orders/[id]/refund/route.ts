import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { requestFullRefund } from '@/lib/ticketing'
import { ticketingErrorResponse } from '@/lib/ticketing/http'

const schema = z.object({ reason: z.string().trim().min(3).max(500) })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Inicia sesión.' } }, { status: 401 })
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Indica el motivo de la devolución.' } }, { status: 400 })
    const { id } = await params
    return NextResponse.json({ data: await requestFullRefund(session.user.id, id, parsed.data.reason, session.user.role === 'ADMIN') })
  } catch (error) {
    return ticketingErrorResponse(error)
  }
}
