import { NextResponse } from 'next/server'
import { getPublicTicketingBySlug } from '@/lib/ticketing'
import { ticketingErrorResponse } from '@/lib/ticketing/http'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    return NextResponse.json({ data: await getPublicTicketingBySlug(slug) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return ticketingErrorResponse(error) }
}
