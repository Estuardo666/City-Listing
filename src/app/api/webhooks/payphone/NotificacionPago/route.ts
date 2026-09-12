import { NextResponse } from 'next/server'
import { processPayphoneNotification } from '@/lib/ticketing'
import { ticketingErrorResponse } from '@/lib/ticketing/http'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    await processPayphoneNotification(payload)
    return NextResponse.json({ Response: true, ErrorCode: '000' })
  } catch (error) {
    const response = ticketingErrorResponse(error)
    console.error('[ticketing] PayPhone notification failed', response.status)
    return NextResponse.json({ Response: false, ErrorCode: '222' }, { status: response.status >= 500 ? 500 : 200 })
  }
}
