import { NextResponse } from 'next/server'
import { getTicketOrderStatus } from '@/lib/ticketing'
import { ticketingErrorResponse } from '@/lib/ticketing/http'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const clientTransactionId = new URL(request.url).searchParams.get('clientTransactionId')?.trim() ?? ''
    if (!/^vl_[a-f0-9]{32}$/.test(clientTransactionId)) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Referencia de pago inválida.' } }, { status: 400 })
    }
    return NextResponse.json({ data: await getTicketOrderStatus(clientTransactionId) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return ticketingErrorResponse(error)
  }
}
