import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'
import { hashSecret } from '@/lib/ticketing/secrets'
import { ticketScanUrl } from '@/lib/ticketing/links'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')?.trim() ?? ''
  if (token.length < 20 || token.length > 160) return new NextResponse('Invalid ticket token', { status: 400 })

  const ticket = await prisma.ticket.findUnique({ where: { qrTokenHash: hashSecret(token) }, select: { id: true, status: true } })
  if (!ticket || ticket.status === 'VOID') return new NextResponse('Ticket not found', { status: 404 })

  const image = await QRCode.toBuffer(ticketScanUrl(token, new URL(request.url).origin), {
    type: 'png',
    width: 640,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f172a', light: '#ffffff' },
  })
  return new NextResponse(new Uint8Array(image), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, no-store, max-age=0',
    },
  })
}
