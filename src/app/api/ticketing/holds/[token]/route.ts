import { NextResponse } from 'next/server'
import { releaseTicketHold } from '@/lib/ticketing'
import { ticketingErrorResponse } from '@/lib/ticketing/http'

export async function DELETE(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    return NextResponse.json({ data: await releaseTicketHold(token) })
  } catch (error) {
    return ticketingErrorResponse(error)
  }
}
