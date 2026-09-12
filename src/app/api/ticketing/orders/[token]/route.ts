import { NextResponse } from 'next/server'
import { claimTicketOrder, getPublicTicketOrder } from '@/lib/ticketing'
import { ticketingErrorResponse } from '@/lib/ticketing/http'
import { getMobilePrincipal } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    return NextResponse.json({ data: await getPublicTicketOrder(token) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return ticketingErrorResponse(error) }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const principal = await getMobilePrincipal(request)
    if (!principal) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Inicia sesión para vincular la compra.' } }, { status: 401 })
    const { token } = await params
    return NextResponse.json({ data: await claimTicketOrder(token, principal.userId) })
  } catch (error) { return ticketingErrorResponse(error) }
}
