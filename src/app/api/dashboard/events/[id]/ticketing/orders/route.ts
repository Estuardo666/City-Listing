import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { listEventTicketOrders } from '@/lib/ticketing'
import { ticketingErrorResponse } from '@/lib/ticketing/http'

export const dynamic = 'force-dynamic'

function csv(value: unknown) {
  const text = value == null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Inicia sesión.' } }, { status: 401 })
    const { id } = await params
    const orders = await listEventTicketOrders(session.user.id, id, session.user.role === 'ADMIN')
    if (new URL(request.url).searchParams.get('format') === 'csv') {
      const rows = [
        ['orden', 'estado', 'comprador', 'correo', 'telefono', 'subtotal_centavos', 'comision_centavos', 'total_centavos', 'moneda', 'boletos', 'pagado_en', 'creado_en'],
        ...orders.map((order) => [order.id, order.status, order.buyerName, order.buyerEmail, order.buyerPhone, order.subtotalCents, order.platformFeeCents, order.totalCents, order.currency, order._count.tickets, order.paidAt?.toISOString() ?? '', order.createdAt.toISOString()]),
      ]
      return new NextResponse(`\uFEFF${rows.map((row) => row.map(csv).join(',')).join('\n')}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="viveloja-ventas.csv"', 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json({ data: orders }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return ticketingErrorResponse(error)
  }
}
