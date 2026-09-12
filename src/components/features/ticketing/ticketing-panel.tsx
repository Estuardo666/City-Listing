'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Armchair,
  ArrowRight,
  Clock3,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type TicketType = {
  id: string
  name: string
  description: string | null
  kind: 'GENERAL' | 'NUMBERED' | 'ASSIGNED_SEAT'
  priceCents: number
  available: number | null
  minPerOrder: number
  maxPerOrder: number
}

type Seat = {
  id: string
  seatKey: string
  section: string | null
  rowLabel: string | null
  seatNumber: string
  x: number | null
  y: number | null
  status: string
  ticketTypeId: string | null
}

type TicketingData = {
  eventId: string
  mode: 'NONE' | 'INTERNAL' | 'EXTERNAL'
  externalUrl?: string | null
  externalProviderLabel?: string | null
  currency?: string
  feeIncidence?: 'NONE' | 'BUYER_PAYS' | 'ORGANIZER_ABSORBS'
  feePercentBps?: number
  feeFixedCents?: number
  salesStartAt?: string | null
  salesEndAt?: string | null
  status?: string
  ticketTypes?: TicketType[]
  seatMap?: { id: string; version: number; name: string | null; seats: Seat[] } | null
}

type Hold = {
  token: string
  expiresAt: string
}

type Buyer = {
  name: string
  email: string
  phone: string
  billingDocumentId: string
}

function money(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency }).format(cents / 100)
}

function randomKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function dateLabel(value: string | null | undefined) {
  if (!value) return null
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Guayaquil' }).format(new Date(value))
}

async function errorMessage(response: Response) {
  const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
  return body?.error?.message ?? 'No se pudo completar la operación.'
}

export function TicketingPanel({ eventSlug }: { eventSlug: string }) {
  const [ticketing, setTicketing] = useState<TicketingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [sessionKey, setSessionKey] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [selectedSeats, setSelectedSeats] = useState<Record<string, string[]>>({})
  const [hold, setHold] = useState<Hold | null>(null)
  const [step, setStep] = useState<'select' | 'buyer'>('select')
  const [buyer, setBuyer] = useState<Buyer>({ name: '', email: '', phone: '', billingDocumentId: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/ticketing/events/${encodeURIComponent(eventSlug)}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(await errorMessage(response))
        return response.json() as Promise<{ data: TicketingData }>
      })
      .then((body) => {
        if (!cancelled) setTicketing(body.data)
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'No se pudo cargar la boletería.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [eventSlug])

  useEffect(() => {
    const storageKey = 'viveloja.ticketing.session'
    const current = window.sessionStorage.getItem(storageKey) ?? randomKey()
    window.sessionStorage.setItem(storageKey, current)
    setSessionKey(current)
  }, [])

  const currency = ticketing?.currency ?? 'USD'
  const items = useMemo(() => (ticketing?.ticketTypes ?? []).flatMap((type) => {
    const seats = selectedSeats[type.id] ?? []
    const quantity = type.kind === 'ASSIGNED_SEAT' ? seats.length : quantities[type.id] ?? 0
    if (!quantity) return []
    return [{ ticketTypeId: type.id, quantity, ...(type.kind === 'ASSIGNED_SEAT' ? { eventSeatIds: seats } : {}) }]
  }), [quantities, selectedSeats, ticketing?.ticketTypes])

  const selectedCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalCents = useMemo(() => (ticketing?.ticketTypes ?? []).reduce((sum, type) => {
    const line = items.find((item) => item.ticketTypeId === type.id)
    return sum + (line?.quantity ?? 0) * type.priceCents
  }, 0), [items, ticketing?.ticketTypes])
  const feeCents = ticketing?.feeIncidence && ticketing.feeIncidence !== 'NONE'
    ? Math.floor((subtotalCents * (ticketing.feePercentBps ?? 0) + 5000) / 10000) + (ticketing.feeFixedCents ?? 0)
    : 0
  const totalCents = ticketing?.feeIncidence === 'ORGANIZER_ABSORBS' ? subtotalCents : subtotalCents + feeCents

  if (loading) return <div className="h-32 animate-pulse rounded-2xl border border-border/50 bg-card" aria-label="Cargando boletería" />
  if (!ticketing || ticketing.mode === 'NONE') return null

  if (ticketing.mode === 'EXTERNAL') {
    return (
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5" aria-label="Compra de entradas">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Ticket className="h-5 w-5" /></div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Entradas</h2>
            <p className="mt-1 text-sm text-muted-foreground">La venta se realiza en {ticketing.externalProviderLabel || 'el sitio del organizador'}.</p>
          </div>
        </div>
        {ticketing.externalUrl && (
          <Button asChild className="mt-4 w-full">
            <a href={ticketing.externalUrl} target="_blank" rel="nofollow sponsored noopener">
              Comprar entradas <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
      </section>
    )
  }

  const saleStart = dateLabel(ticketing.salesStartAt)
  const saleEnd = dateLabel(ticketing.salesEndAt)
  const saleClosed = ticketing.status !== 'READY' && ticketing.status !== 'ON_SALE'
  const saleNotStarted = !!ticketing.salesStartAt && new Date(ticketing.salesStartAt) > new Date()
  const saleFinished = !!ticketing.salesEndAt && new Date(ticketing.salesEndAt) <= new Date()

  const updateQuantity = (type: TicketType, delta: number) => {
    setMessage(null)
    setQuantities((current) => {
      const currentValue = current[type.id] ?? 0
      const min = type.minPerOrder
      const max = Math.min(type.maxPerOrder, type.available ?? type.maxPerOrder)
      const next = currentValue === 0 && delta > 0 ? min : Math.max(0, Math.min(max, currentValue + delta))
      return { ...current, [type.id]: next }
    })
  }

  const toggleSeat = (typeId: string, seatId: string, maxPerOrder: number) => {
    setMessage(null)
    setSelectedSeats((current) => {
      const selected = current[typeId] ?? []
      if (selected.includes(seatId)) return { ...current, [typeId]: selected.filter((id) => id !== seatId) }
      if (selected.length >= maxPerOrder) {
        setMessage(`Puedes seleccionar hasta ${maxPerOrder} asientos de este tipo.`)
        return current
      }
      return { ...current, [typeId]: [...selected, seatId] }
    })
  }

  const startHold = async () => {
    if (!sessionKey || !items.length) return
    setSubmitting(true)
    setMessage(null)
    try {
      const response = await fetch('/api/ticketing/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': randomKey() },
        body: JSON.stringify({ eventSlug, sessionKey, items }),
      })
      if (!response.ok) throw new Error(await errorMessage(response))
      const body = await response.json() as { data: { token: string | null; expiresAt: string } }
      if (!body.data.token) throw new Error('No se pudo conservar la selección. Vuelve a intentarlo.')
      setHold({ token: body.data.token, expiresAt: body.data.expiresAt })
      setStep('buyer')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo reservar las entradas.')
    } finally {
      setSubmitting(false)
    }
  }

  const startCheckout = async () => {
    if (!hold) return
    setSubmitting(true)
    setMessage(null)
    try {
      const response = await fetch('/api/ticketing/checkouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': randomKey() },
        body: JSON.stringify({ holdToken: hold.token, buyerName: buyer.name, buyerEmail: buyer.email, buyerPhone: buyer.phone, billingDocumentId: buyer.billingDocumentId || null }),
      })
      if (!response.ok) throw new Error(await errorMessage(response))
      const body = await response.json() as { data: { status: string; checkoutUrl: string | null; clientTransactionId: string } }
      if (body.data.checkoutUrl) {
        window.location.assign(body.data.checkoutUrl)
        return
      }
      window.location.assign(`/checkout/result?status=paid&token=${encodeURIComponent(hold.token)}&clientTransactionId=${encodeURIComponent(body.data.clientTransactionId)}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar el pago.')
      setSubmitting(false)
    }
  }

  const cancelHold = async () => {
    if (hold) await fetch(`/api/ticketing/holds/${encodeURIComponent(hold.token)}`, { method: 'DELETE' }).catch(() => undefined)
    setHold(null)
    setStep('select')
    setMessage(null)
  }

  return (
    <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm" aria-label="Compra de entradas">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Ticket className="h-5 w-5" /></div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Compra tus entradas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Reserva tu lugar durante 10 minutos y paga de forma segura con PayPhone.</p>
        </div>
      </div>

      {step === 'select' ? (
        <>
          {(saleStart || saleEnd) && <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4" />{saleStart ? `Desde ${saleStart}` : ''}{saleEnd ? ` · hasta ${saleEnd}` : ''}</p>}
          {saleClosed || saleNotStarted || saleFinished ? (
            <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{saleNotStarted ? 'La venta todavía no comienza.' : saleFinished ? 'La venta ya terminó.' : 'La venta está pausada por el organizador.'}</p>
          ) : (
            <>
              <div className="mt-4 space-y-3">
                {(ticketing.ticketTypes ?? []).map((type) => {
                  const selected = selectedSeats[type.id] ?? []
                  const quantity = type.kind === 'ASSIGNED_SEAT' ? selected.length : quantities[type.id] ?? 0
                  const soldOut = type.available !== null && type.available <= 0
                  return (
                    <div key={type.id} className="rounded-xl border border-border/60 p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{type.name}</p>
                          {type.description && <p className="mt-1 text-xs text-muted-foreground">{type.description}</p>}
                          <p className="mt-2 text-sm font-semibold text-primary">{money(type.priceCents, currency)}</p>
                        </div>
                        {type.kind !== 'ASSIGNED_SEAT' ? (
                          <div className="flex items-center gap-2" aria-label={`Cantidad de ${type.name}`}>
                            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQuantity(type, -1)} disabled={!quantity || soldOut}><Minus className="h-4 w-4" /></Button>
                            <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
                            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQuantity(type, 1)} disabled={soldOut || quantity >= type.maxPerOrder || (type.available !== null && quantity >= type.available)}><Plus className="h-4 w-4" /></Button>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">{soldOut ? 'Agotado' : `${selected.length} seleccionados`}</span>}
                      </div>
                      {type.kind === 'ASSIGNED_SEAT' && ticketing.seatMap && !soldOut && (
                        <div className="mt-3 border-t border-border/50 pt-3">
                          <p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Armchair className="h-4 w-4" />{ticketing.seatMap.name || 'Selecciona tus asientos'}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ticketing.seatMap.seats.filter((seat) => !seat.ticketTypeId || seat.ticketTypeId === type.id).map((seat) => {
                              const active = selected.includes(seat.id)
                              const unavailable = seat.status !== 'AVAILABLE'
                              return <button key={seat.id} type="button" aria-label={`Asiento ${seatLabel(seat)}`} aria-pressed={active} disabled={unavailable} onClick={() => toggleSeat(type.id, seat.id, type.maxPerOrder)} className={`min-w-9 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${active ? 'border-primary bg-primary text-primary-foreground' : unavailable ? 'cursor-not-allowed border-border/40 bg-muted text-muted-foreground/50' : 'border-border bg-background text-foreground hover:border-primary hover:bg-primary/5'}`}>{seat.seatNumber}</button>
                            })}
                          </div>
                        </div>
                      )}
                      {type.available !== null && <p className="mt-2 text-[11px] text-muted-foreground">{soldOut ? 'Agotado' : `${type.available} disponibles`}</p>}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 rounded-xl bg-muted/60 p-4">
                <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal ({selectedCount} {selectedCount === 1 ? 'entrada' : 'entradas'})</span><span>{money(subtotalCents, currency)}</span></div>
                {feeCents > 0 && <div className="mt-1 flex justify-between text-sm text-muted-foreground"><span>Tarifa de servicio</span><span>{money(feeCents, currency)}</span></div>}
                {ticketing.feeIncidence === 'ORGANIZER_ABSORBS' && <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">La tarifa de servicio la asume el organizador.</p>}
                <div className="mt-2 flex justify-between border-t border-border/60 pt-2 font-semibold text-foreground"><span>Total</span><span>{money(totalCents, currency)}</span></div>
              </div>
              {message && <p role="alert" className="mt-3 text-sm text-destructive">{message}</p>}
              <Button type="button" className="mt-4 w-full" onClick={startHold} disabled={!items.length || submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reservando…</> : <>Continuar <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Pago procesado por PayPhone · no guardamos datos de tarjeta</p>
            </>
          )}
        </>
      ) : (
        <div className="mt-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-foreground"><p className="font-semibold">Selección reservada</p><p className="mt-1 text-xs text-muted-foreground">Completa tus datos. La reserva vence {dateLabel(hold?.expiresAt) ?? 'pronto'}.</p></div>
          <div className="mt-4 space-y-3">
            <div><Label htmlFor="ticket-buyer-name">Nombre completo</Label><Input id="ticket-buyer-name" className="mt-1.5" value={buyer.name} onChange={(event) => setBuyer({ ...buyer, name: event.target.value })} autoComplete="name" /></div>
            <div><Label htmlFor="ticket-buyer-email">Correo electrónico</Label><Input id="ticket-buyer-email" className="mt-1.5" type="email" value={buyer.email} onChange={(event) => setBuyer({ ...buyer, email: event.target.value })} autoComplete="email" /></div>
            <div><Label htmlFor="ticket-buyer-phone">Teléfono</Label><Input id="ticket-buyer-phone" className="mt-1.5" type="tel" value={buyer.phone} onChange={(event) => setBuyer({ ...buyer, phone: event.target.value })} autoComplete="tel" placeholder="09…" /></div>
            <div><Label htmlFor="ticket-buyer-document">Cédula / RUC <span className="font-normal text-muted-foreground">(opcional)</span></Label><Input id="ticket-buyer-document" className="mt-1.5" value={buyer.billingDocumentId} onChange={(event) => setBuyer({ ...buyer, billingDocumentId: event.target.value })} /></div>
          </div>
          {message && <p role="alert" className="mt-3 text-sm text-destructive">{message}</p>}
          <div className="mt-4 flex gap-2"><Button type="button" variant="outline" onClick={cancelHold} disabled={submitting}>Atrás</Button><Button type="button" className="flex-1" onClick={startCheckout} disabled={submitting || !buyer.name.trim() || !buyer.email.includes('@') || buyer.phone.trim().length < 7}>{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparando pago…</> : <>Pagar {money(totalCents, currency)} <ArrowRight className="ml-2 h-4 w-4" /></>}</Button></div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Users className="h-3.5 w-3.5" /> Recibirás tus entradas y códigos QR en este correo.</p>
        </div>
      )}
    </section>
  )
}

function seatLabel(seat: Seat) {
  return [seat.section, seat.rowLabel, seat.seatNumber].filter(Boolean).join(' · ')
}
