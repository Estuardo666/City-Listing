import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { listOrganizerPayphoneAccounts, saveOrganizerPayphoneAccount } from '@/lib/ticketing'
import { ticketingErrorResponse } from '@/lib/ticketing/http'

const schema = z.object({ storeId: z.string().trim().min(1).max(120), token: z.string().trim().min(12).max(2000), displayName: z.string().trim().max(120).nullable().optional(), merchantReference: z.string().trim().max(160).nullable().optional() })

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Inicia sesión.' } }, { status: 401 })
    return NextResponse.json({ data: await listOrganizerPayphoneAccounts(session.user.id) })
  } catch (error) { return ticketingErrorResponse(error) }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Inicia sesión.' } }, { status: 401 })
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' } }, { status: 400 })
    return NextResponse.json({ data: await saveOrganizerPayphoneAccount({ actorId: session.user.id, ...parsed.data }) })
  } catch (error) { return ticketingErrorResponse(error) }
}
