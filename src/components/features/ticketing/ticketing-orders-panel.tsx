'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2, RefreshCw, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Order = {
  id: string
  status: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  subtotalCents: number
  platformFeeCents: number
  totalCents: number
  refundedCents: number
  currency: string
  paidAt: string | null
  createdAt: string
  items: Array<{ nameSnapshot: string; seatLabel: string | null; quantity: number; unitPriceCents: number; subtotalCents: number }>
  _count: { tickets: number; refunds: number }
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency }).format(cents / 100)
}

async function readError(response: Response) {
  const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
  return body?.error?.message ?? 'No se pudo completar la operación.'
}

export function TicketingOrdersPanel({ eventId }: { eventId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dashboard/events/${eventId}/ticketing/orders`, { cache: 'no-store' })
      if (!response.ok) throw new Error(await readError(response))
      const body = await response.json() as { data: Order[] }
      setOrders(body.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar las ventas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [eventId])

  const refund = async () => {
    if (!selectedOrder || reason.trim().length < 3) return
    setProcessing(true)
    try {
      const response = await fetch(`/api/dashboard/ticketing/orders/${selectedOrder}/refund`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) })
      if (!response.ok) throw new Error(await readError(response))
      toast.success('Devolución procesada')
      setSelectedOrder(null)
      setReason('')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo procesar la devolución.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-foreground">Ventas y devoluciones</h2><p className="mt-1 text-sm text-muted-foreground">Consulta las órdenes, descarga un CSV y procesa devoluciones totales.</p></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Actualizar</Button><Button asChild type="button" variant="outline" size="sm"><a href={`/api/dashboard/events/${eventId}/ticketing/orders?format=csv`}><Download className="mr-2 h-4 w-4" />CSV</a></Button></div></div>
      {loading ? <div className="mt-5 h-24 animate-pulse rounded-xl bg-muted" /> : orders.length === 0 ? <p className="mt-5 rounded-xl bg-muted p-4 text-sm text-muted-foreground">Todavía no hay ventas para este evento.</p> : <div className="mt-5 space-y-3">{orders.map((order) => <article key={order.id} className="rounded-xl border border-border/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-foreground">{order.buyerName}</p><p className="text-xs text-muted-foreground">{order.buyerEmail} · {order.buyerPhone}</p><p className="mt-2 text-xs text-muted-foreground">{order.items.map((item) => `${item.quantity}× ${item.nameSnapshot}${item.seatLabel ? ` (${item.seatLabel})` : ''}`).join(' · ')}</p></div><div className="text-right"><p className="font-semibold text-foreground">{money(order.totalCents, order.currency)}</p><p className={`text-xs font-semibold ${order.status === 'PAID' ? 'text-emerald-700 dark:text-emerald-400' : order.status === 'REFUNDED' ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}>{order.status}</p><p className="text-xs text-muted-foreground">{order._count.tickets} entradas</p></div></div>{order.status === 'PAID' && <div className="mt-3 border-t border-border/50 pt-3"><Button type="button" variant="outline" size="sm" onClick={() => { setSelectedOrder(selectedOrder === order.id ? null : order.id); setReason('') }}><RotateCcw className="mr-2 h-4 w-4" />Devolución total</Button>{selectedOrder === order.id && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input placeholder="Motivo de la devolución" value={reason} onChange={(event) => setReason(event.target.value)} /><Button type="button" variant="destructive" onClick={() => void refund()} disabled={processing || reason.trim().length < 3}>{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar devolución'}</Button></div>}</div>}</article>)}</div>}
    </section>
  )
}
