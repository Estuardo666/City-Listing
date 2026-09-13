'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, ExternalLink, Loader2, Ticket as TicketIcon, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PublicTicket = {
  id: string
  code: string
  qrData: string
  qrImageUrl: string
  seatLabel: string | null
  status: string
  issuedAt: string
  ticketType: { name: string; kind: string }
}

type PublicOrder = {
  id: string
  status: string
  buyerName: string
  buyerEmail: string
  subtotalCents: number
  platformFeeCents: number
  totalCents: number
  currency: string
  paidAt: string | null
  event: { id: string; title: string; slug: string; startDate: string; endDate: string | null; location: string; address: string | null }
  tickets: PublicTicket[]
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency }).format(cents / 100)
}

async function readJson(response: Response) {
  return response.json().catch(() => null) as Promise<{ data?: PublicOrder; error?: { message?: string } } | null>
}

export function CheckoutResultClient({ token, clientTransactionId, statusParam }: { token: string; clientTransactionId: string; statusParam: string }) {
  const [order, setOrder] = useState<PublicOrder | null>(null)
  const [status, setStatus] = useState(statusParam === 'paid' ? 'PENDING_PAYMENT' : statusParam === 'failed' ? 'FAILED' : 'PENDING_PAYMENT')
  const [error, setError] = useState<string | null>(null)
  const nativeReturnUrl = `viveloja://checkout/result?${new URLSearchParams({ token, clientTransactionId, status: statusParam || 'pending' }).toString()}`

  useEffect(() => {
    if (!token) return
    const timer = window.setTimeout(() => window.location.assign(nativeReturnUrl), 250)
    return () => window.clearTimeout(timer)
  }, [nativeReturnUrl, token])

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined
    let attempts = 0

    const refresh = async () => {
      try {
        if (token) {
          const response = await fetch(`/api/ticketing/orders/${encodeURIComponent(token)}`, { cache: 'no-store' })
          const body = await readJson(response)
          if (response.ok && body?.data) {
            if (!cancelled) {
              setOrder(body.data)
              setStatus(body.data.status)
              setError(null)
            }
            return body.data.status
          }
        }
        if (clientTransactionId) {
          const response = await fetch(`/api/ticketing/status?clientTransactionId=${encodeURIComponent(clientTransactionId)}`, { cache: 'no-store' })
          const body = await readJson(response)
          if (response.ok && body?.data && !cancelled) setStatus(body.data.status)
        }
      } catch {
        if (!cancelled) setError('No se pudo consultar el estado. Puedes volver a cargar esta página.')
      }
      return null
    }

    const run = async () => {
      const current = await refresh()
      if (cancelled) return
      attempts += 1
      if (!['PAID', 'FAILED', 'EXPIRED', 'REFUNDED'].includes(current ?? status) && attempts < 25) timer = window.setTimeout(run, 3000)
    }
    void run()
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [clientTransactionId, status, token])

  const isPaid = order?.status === 'PAID' || status === 'PAID'
  const isFailed = ['FAILED', 'EXPIRED'].includes(order?.status ?? status)

  return (
    <main className="section-shell py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-10">
          {isPaid ? (
            <>
              <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40"><CheckCircle2 className="h-7 w-7" /></div><div><h1 className="text-2xl font-semibold text-foreground">¡Compra confirmada!</h1><p className="mt-1 text-sm text-muted-foreground">Tus entradas están listas{order ? ` para ${order.event.title}` : '.'}</p></div></div>
              {order && <><div className="mt-6 rounded-2xl bg-muted/60 p-4"><div className="flex justify-between text-sm text-muted-foreground"><span>Comprador</span><span className="font-medium text-foreground">{order.buyerName}</span></div><div className="mt-2 flex justify-between text-sm text-muted-foreground"><span>Enviado a</span><span className="font-medium text-foreground">{order.buyerEmail}</span></div><div className="mt-2 flex justify-between border-t border-border/60 pt-2 text-sm font-semibold text-foreground"><span>Total</span><span>{money(order.totalCents, order.currency)}</span></div></div><div className="mt-6 space-y-4"><h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><TicketIcon className="h-5 w-5 text-primary" /> Tus entradas</h2>{order.tickets.length ? order.tickets.map((ticket) => <article key={ticket.id} className="flex flex-col gap-4 rounded-2xl border border-border/60 p-4 sm:flex-row sm:items-center"><img src={ticket.qrImageUrl} alt={`Código QR de ${ticket.code}`} className="h-44 w-44 self-center rounded-xl border border-border bg-white p-2 sm:self-auto" /><div className="flex-1"><p className="text-sm font-semibold text-foreground">{ticket.ticketType.name}</p><p className="mt-1 text-sm text-muted-foreground">Código: <span className="font-mono text-foreground">{ticket.code}</span></p>{ticket.seatLabel && <p className="mt-1 text-sm text-muted-foreground">Asiento: <span className="font-medium text-foreground">{ticket.seatLabel}</span></p>}<a href={ticket.qrData} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Abrir ticket <ExternalLink className="h-3.5 w-3.5" /></a></div></article>) : <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Estamos generando tus códigos QR. Recarga en unos segundos o revisa tu correo.</p>}</div></>}
              <div className="mt-8 flex flex-wrap gap-3"><Button asChild><a href={nativeReturnUrl}>Abrir Vive Loja</a></Button><Button asChild variant="outline"><Link href={order ? `/eventos/${order.event.slug}` : '/eventos'}>Volver al evento</Link></Button><Button asChild variant="outline"><Link href="/dashboard">Ir a mi cuenta</Link></Button></div>
            </>
          ) : isFailed ? (
            <><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><XCircle className="h-7 w-7" /></div><div><h1 className="text-2xl font-semibold text-foreground">No se completó el pago</h1><p className="mt-1 text-sm text-muted-foreground">Puedes volver a Vive Loja para reintentar mientras tu reserva siga activa.</p></div></div><div className="mt-8 flex flex-wrap gap-3"><Button asChild><a href={nativeReturnUrl}>Volver a Vive Loja</a></Button><Button asChild variant="outline"><Link href="/eventos">Volver a eventos</Link></Button></div></>
          ) : (
            <><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40">{error ? <Clock3 className="h-7 w-7" /> : <Loader2 className="h-7 w-7 animate-spin" />}</div><div><h1 className="text-2xl font-semibold text-foreground">Confirmando tu pago…</h1><p className="mt-1 text-sm text-muted-foreground">PayPhone está confirmando la transacción. No cierres esta página.</p>{clientTransactionId && <p className="mt-3 text-xs text-muted-foreground">Referencia: <span className="font-mono">{clientTransactionId}</span></p>}</div></div>{error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}<div className="mt-8"><Button asChild variant="outline"><a href={nativeReturnUrl}>Volver a Vive Loja</a></Button></div></>
          )}
        </div>
      </div>
    </main>
  )
}
