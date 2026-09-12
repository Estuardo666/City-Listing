#!/usr/bin/env node

import { randomUUID } from 'node:crypto'

const baseURL = new URL(process.env.TICKETING_SMOKE_BASE_URL ?? 'http://localhost:3000')
const eventSlug = process.env.TICKETING_SMOKE_EVENT_SLUG?.trim()
const allowMutations = process.env.TICKETING_SMOKE_ALLOW_MUTATIONS === '1'
const allowCheckout = process.env.TICKETING_SMOKE_ALLOW_CHECKOUT === '1'

if (!eventSlug) {
  console.error('Falta TICKETING_SMOKE_EVENT_SLUG, por ejemplo: evento-de-prueba')
  process.exit(2)
}

function endpoint(path) {
  return new URL(path.replace(/^\//, ''), baseURL).toString()
}

async function request(path, options = {}) {
  const response = await fetch(endpoint(path), {
    ...options,
    headers: { Accept: 'application/json', ...(options.headers ?? {}) },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body?.error?.message ?? `HTTP ${response.status}`
    throw new Error(`${options.method ?? 'GET'} ${path}: ${message}`)
  }
  return body?.data ?? body
}

function chooseSelection(ticketing) {
  const types = Array.isArray(ticketing.ticketTypes) ? ticketing.ticketTypes : []
  const type = types.find((candidate) => candidate.kind !== 'ASSIGNED_SEAT' && (candidate.available === null || candidate.available >= Math.max(1, candidate.minPerOrder ?? 1)))
    ?? types.find((candidate) => candidate.kind === 'ASSIGNED_SEAT' && (candidate.available === null || candidate.available > 0))
  if (!type) throw new Error('No existe un tipo de boleto con inventario disponible.')

  if (type.kind === 'ASSIGNED_SEAT') {
    const seat = ticketing.seatMap?.seats?.find((candidate) => candidate.status === 'AVAILABLE' && (!candidate.ticketTypeId || candidate.ticketTypeId === type.id))
    if (!seat) throw new Error('El tipo elegido requiere mapa, pero no hay asientos disponibles.')
    return { ticketTypeId: type.id, quantity: 1, eventSeatIds: [seat.id] }
  }

  return { ticketTypeId: type.id, quantity: Math.max(1, type.minPerOrder ?? 1) }
}

async function main() {
  const ticketing = await request(`/api/ticketing/events/${encodeURIComponent(eventSlug)}`)
  console.log(`GET ticketing: OK (${ticketing.mode})`)

  if (ticketing.mode === 'EXTERNAL') {
    if (!ticketing.externalUrl?.startsWith('https://')) throw new Error('La URL externa no es HTTPS.')
    console.log(`Modo externo: ${ticketing.externalUrl}`)
    return
  }
  if (ticketing.mode !== 'INTERNAL') {
    console.log('El evento no tiene venta interna; smoke test terminado.')
    return
  }
  if (!allowMutations) {
    console.log('Modo lectura. Usa TICKETING_SMOKE_ALLOW_MUTATIONS=1 para probar hold/idempotencia.')
    return
  }

  const selection = chooseSelection(ticketing)
  const sessionKey = `smoke-${randomUUID()}`
  const idempotencyKey = `smoke-hold-${randomUUID()}`
  const payload = JSON.stringify({ eventSlug, sessionKey, items: [selection] })
  let hold
  let checkoutCreated = false
  try {
    hold = await request('/api/ticketing/holds', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: payload })
    if (!hold.token || !hold.id) throw new Error('La respuesta de hold no contiene token/id.')
    console.log(`POST hold: OK (${hold.id})`)

    const retry = await request('/api/ticketing/holds', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: payload })
    if (retry.id !== hold.id || retry.idempotent !== true) throw new Error('La repetición del hold no fue idempotente.')
    console.log('POST hold repetido: OK (idempotente)')

    if (allowCheckout) {
      const checkout = await request('/api/ticketing/checkouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `smoke-checkout-${randomUUID()}` },
        body: JSON.stringify({ holdToken: hold.token, buyerName: 'Vive Loja Smoke Test', buyerEmail: process.env.TICKETING_SMOKE_EMAIL ?? 'smoke@example.com', buyerPhone: process.env.TICKETING_SMOKE_PHONE ?? '0999999999' }),
      })
      checkoutCreated = true
      console.log(`POST checkout: OK (${checkout.status}, ${checkout.checkoutUrl ?? 'sin pago — orden gratuita'})`)
    } else {
      console.log('Checkout omitido. Usa TICKETING_SMOKE_ALLOW_CHECKOUT=1 sólo en PayPhone sandbox.')
    }
  } finally {
    if (hold?.token && !checkoutCreated) {
      await request(`/api/ticketing/holds/${encodeURIComponent(hold.token)}`, { method: 'DELETE' })
      console.log('DELETE hold: OK (inventario liberado)')
    }
  }
}

main().catch((error) => {
  console.error(`Smoke test falló: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
