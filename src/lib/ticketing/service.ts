import 'server-only'

import { Prisma } from '@prisma/client'
import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { canManageVenue, ensureBusinessAccount, getBusinessAccountForUser, getPlanForUser, resolveEffectivePlan, type EffectivePlan } from '@/lib/billing/plans'
import { createPublicToken, decryptSecret, encryptSecret, hashSecret } from './secrets'
import { calculatePlatformFee } from './money'
import {
  DEFAULT_CURRENCY,
  DEFAULT_HOLD_MINUTES,
  DEFAULT_MAX_TICKETS_PER_ORDER,
  TicketingError,
  TICKETING_ERROR_CODES,
} from './constants'
import {
  confirmPayphonePayment,
  parsePayphoneNotification,
  preparePayphoneCheckout,
  normalizePayphonePhone,
  reversePayphonePayment,
  type NormalizedPayphonePayment,
  type PayphoneCredentials,
} from './provider/payphone'
import { publishTicketOutbox } from './outbox'
import { ticketingBaseUrl } from './links'
import { sendTicketOrderAdminEmail, sendTicketOrderEmail } from '@/lib/email/templates/ticket-order'

type Db = Prisma.TransactionClient

export type TicketSelection = {
  ticketTypeId: string
  quantity: number
  eventSeatIds?: string[]
}

export type ConfigureTicketingInput = {
  mode: 'NONE' | 'INTERNAL' | 'EXTERNAL'
  sellerType?: 'PLATFORM' | 'ORGANIZER'
  paymentAccountId?: string | null
  externalUrl?: string | null
  externalProviderLabel?: string | null
  feeIncidence?: 'NONE' | 'BUYER_PAYS' | 'ORGANIZER_ABSORBS'
  feePercentBps?: number
  feeFixedCents?: number
  salesStartAt?: Date | null
  salesEndAt?: Date | null
  status?: 'DRAFT' | 'READY' | 'ON_SALE' | 'PAUSED' | 'ENDED'
}

export type TicketTypeInput = {
  id?: string
  slug: string
  name: string
  description?: string | null
  kind: 'GENERAL' | 'NUMBERED' | 'ASSIGNED_SEAT'
  priceCents: number
  capacity?: number | null
  minPerOrder?: number
  maxPerOrder?: number
  salesStartAt?: Date | null
  salesEndAt?: Date | null
  sortOrder?: number
  isActive?: boolean
}

const publicTicketSelect = {
  id: true,
  code: true,
  seatLabel: true,
  status: true,
  issuedAt: true,
  event: { select: { id: true, title: true, slug: true, startDate: true, location: true } },
  ticketType: { select: { id: true, name: true, kind: true } },
} as const

function normalizedEmail(value: string) {
  return value.trim().toLowerCase()
}

// Explicitly blocked operational recipient. This is a delivery guard, not a
// replacement for removing the address from provider/dashboard settings.
const blockedTicketingRecipients = new Set(['admin@transcitynorwalk.com'])

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function appUrl() {
  return ticketingBaseUrl(process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL)
}

function assertHttpsUrl(value: string) {
  let url: URL
  try { url = new URL(value) } catch { throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'La URL externa no es válida.') }
  if (url.protocol !== 'https:' || url.username || url.password || url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1') {
    throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'La URL externa debe ser HTTPS y pública.')
  }
  return url.toString()
}

function assertNonNegativeInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, `${label} no es válido.`)
}

function isPlanAllowed(plan: EffectivePlan, capability: 'eventTicketingEnabled' | 'seatMapsEnabled') {
  return plan.capabilities[capability]
}

async function planForEvent(event: { userId: string; venueId: string | null }) {
  return event.venueId ? resolveEffectivePlan(event.venueId) : getPlanForUser(event.userId)
}

async function canManageEvent(actorId: string, eventId: string, isAdmin = false) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { userId: true, venueId: true } })
  if (!event) return false
  if (isAdmin || event.userId === actorId) return true
  return !!event.venueId && canManageVenue(actorId, event.venueId)
}

async function getEventWithTicketing(identifier: { id?: string; slug?: string }) {
  return prisma.event.findFirst({
    where: identifier.id ? { id: identifier.id } : { slug: identifier.slug },
    include: {
      user: { select: { id: true, role: true } },
      ticketingConfig: {
        include: {
          paymentAccount: true,
          ticketTypes: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
          seatMaps: {
            where: { status: 'PUBLISHED' },
            orderBy: { version: 'desc' },
            take: 1,
            include: { seats: { where: { status: { in: ['AVAILABLE', 'BLOCKED'] } }, orderBy: [{ section: 'asc' }, { rowLabel: 'asc' }, { seatNumber: 'asc' }] } },
          },
        },
      },
    },
  })
}

function assertSaleOpen(config: { status: string; salesStartAt: Date | null; salesEndAt: Date | null }, now = new Date()) {
  if (!['READY', 'ON_SALE'].includes(config.status)) throw new TicketingError(TICKETING_ERROR_CODES.SALES_NOT_OPEN, 'La venta de este evento no está activa.', 409)
  if (config.salesStartAt && config.salesStartAt > now) throw new TicketingError(TICKETING_ERROR_CODES.SALES_NOT_OPEN, 'La venta aún no ha comenzado.', 409)
  if (config.salesEndAt && config.salesEndAt <= now) throw new TicketingError(TICKETING_ERROR_CODES.SALES_NOT_OPEN, 'La venta ya terminó.', 409)
}

function seatLabel(seat: { section: string | null; rowLabel: string | null; seatNumber: string }) {
  return [seat.section, seat.rowLabel, seat.seatNumber].filter(Boolean).join(' · ')
}

function publicTicketingResponse(event: NonNullable<Awaited<ReturnType<typeof getEventWithTicketing>>>) {
  const config = event.ticketingConfig
  if (!config) return { eventId: event.id, mode: 'NONE' as const }
  if (config.mode === 'EXTERNAL') {
    return {
      eventId: event.id,
      mode: config.mode,
      externalUrl: config.externalUrl,
      externalProviderLabel: config.externalProviderLabel,
    }
  }
  if (config.mode !== 'INTERNAL') return { eventId: event.id, mode: 'NONE' as const }
  const seats = config.seatMaps[0]?.seats ?? []
  const fee = effectiveFee(config)
  return {
    eventId: event.id,
    mode: config.mode,
    currency: config.currency,
    feeIncidence: fee.incidence,
    feePercentBps: fee.incidence === 'NONE' ? 0 : config.feePercentBps,
    feeFixedCents: fee.incidence === 'NONE' ? 0 : config.feeFixedCents,
    salesStartAt: config.salesStartAt,
    salesEndAt: config.salesEndAt,
    status: config.status,
    ticketTypes: config.ticketTypes.map((type) => ({
      id: type.id,
      slug: type.slug,
      name: type.name,
      description: type.description,
      kind: type.kind,
      priceCents: type.priceCents,
      capacity: type.capacity,
      available: type.capacity === null ? null : Math.max(0, type.capacity - type.heldCount - type.soldCount),
      minPerOrder: type.minPerOrder,
      maxPerOrder: type.maxPerOrder,
      salesStartAt: type.salesStartAt,
      salesEndAt: type.salesEndAt,
    })),
    seatMap: seats.length ? {
      id: config.seatMaps[0].id,
      version: config.seatMaps[0].version,
      name: config.seatMaps[0].name,
      seats: seats.map((seat) => ({ id: seat.id, seatKey: seat.seatKey, section: seat.section, rowLabel: seat.rowLabel, seatNumber: seat.seatNumber, x: seat.x, y: seat.y, status: seat.status, ticketTypeId: seat.ticketTypeId })),
    } : null,
  }
}

export async function getPublicTicketingBySlug(slug: string) {
  const event = await getEventWithTicketing({ slug })
  if (!event || event.status !== 'APPROVED') throw new TicketingError(TICKETING_ERROR_CODES.NOT_FOUND, 'Evento no encontrado.', 404)
  return publicTicketingResponse(event)
}

export async function getManagedEventTicketing(actorId: string, eventId: string, isAdmin = false) {
  if (!(await canManageEvent(actorId, eventId, isAdmin))) throw new TicketingError(TICKETING_ERROR_CODES.FORBIDDEN, 'No tienes permiso para configurar este evento.', 403)
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, userId: true, venueId: true } })
  if (!event) throw new TicketingError(TICKETING_ERROR_CODES.NOT_FOUND, 'Evento no encontrado.', 404)
  const [config, plan] = await Promise.all([
    prisma.eventTicketingConfig.findUnique({
      where: { eventId },
      include: {
        paymentAccount: { select: { id: true, provider: true, storeId: true, displayName: true, status: true, capabilities: true } },
        ticketTypes: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        seatMaps: { where: { status: 'PUBLISHED' }, orderBy: { version: 'desc' }, take: 1, include: { seats: { orderBy: [{ section: 'asc' }, { rowLabel: 'asc' }, { seatNumber: 'asc' }] } } },
      },
    }),
    planForEvent(event),
  ])
  return {
    eventId,
    capabilities: { eventTicketingEnabled: Boolean(plan.capabilities.eventTicketingEnabled), seatMapsEnabled: Boolean(plan.capabilities.seatMapsEnabled) },
    config: config ? {
      id: config.id,
      mode: config.mode,
      sellerType: config.sellerType,
      paymentAccountId: config.paymentAccountId,
      externalUrl: config.externalUrl,
      externalProviderLabel: config.externalProviderLabel,
      feeIncidence: config.feeIncidence,
      feePercentBps: config.feePercentBps,
      feeFixedCents: config.feeFixedCents,
      salesStartAt: config.salesStartAt,
      salesEndAt: config.salesEndAt,
      status: config.status,
      paymentAccount: config.paymentAccount,
      ticketTypes: config.ticketTypes,
      seatMap: config.seatMaps[0] ?? null,
    } : null,
  }
}

export type EventSeatInput = {
  seatKey: string
  section?: string | null
  rowLabel?: string | null
  seatNumber: string
  x: number
  y: number
  ticketTypeId?: string | null
}

export async function replaceEventSeatMap(actorId: string, eventId: string, input: { name: string; seats: EventSeatInput[] }, isAdmin = false) {
  if (!(await canManageEvent(actorId, eventId, isAdmin))) throw new TicketingError(TICKETING_ERROR_CODES.FORBIDDEN, 'No tienes permiso para configurar este evento.', 403)
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, userId: true, venueId: true } })
  const config = await prisma.eventTicketingConfig.findUnique({ where: { eventId }, select: { id: true, mode: true } })
  if (!event || !config) throw new TicketingError(TICKETING_ERROR_CODES.NOT_FOUND, 'Configura primero la venta del evento.', 404)
  if (config.mode !== 'INTERNAL') throw new TicketingError(TICKETING_ERROR_CODES.MODE_NOT_INTERNAL, 'El mapa solo aplica a venta interna.', 409)
  const plan = await planForEvent(event)
  if (!isAdmin && !isPlanAllowed(plan, 'seatMapsEnabled')) throw new TicketingError(TICKETING_ERROR_CODES.PLAN_REQUIRED, 'Los mapas de asientos requieren el plan Pro o Enterprise.', 403, { plan: plan.slug, recommendedPlan: 'pro' })
  if (!input.name.trim() || input.name.trim().length > 120) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'El nombre del mapa no es válido.')
  if (!input.seats.length || input.seats.length > 5000) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'El mapa debe tener entre 1 y 5000 asientos.')
  const keys = new Set<string>()
  for (const seat of input.seats) {
    if (!seat.seatKey.trim() || keys.has(seat.seatKey) || seat.seatKey.length > 80 || !seat.seatNumber.trim() || seat.seatNumber.length > 30 || !Number.isFinite(seat.x) || !Number.isFinite(seat.y)) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Uno de los asientos no es válido.')
    keys.add(seat.seatKey)
  }
  const assignedTypeIds = [...new Set(input.seats.flatMap((seat) => seat.ticketTypeId ? [seat.ticketTypeId] : []))]
  if (assignedTypeIds.length) {
    const types = await prisma.ticketType.findMany({ where: { id: { in: assignedTypeIds }, eventId, kind: 'ASSIGNED_SEAT', isActive: true }, select: { id: true } })
    if (types.length !== assignedTypeIds.length) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'El mapa referencia un tipo de asiento inválido.')
  }

  return serializable(async (tx) => {
    const previous = await tx.eventSeatMapVersion.findFirst({ where: { eventId, status: 'PUBLISHED' }, orderBy: { version: 'desc' }, include: { seats: { select: { status: true } } } })
    if (previous?.seats.some((seat) => seat.status === 'HELD' || seat.status === 'SOLD')) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'No puedes reemplazar un mapa con asientos reservados o vendidos.')
    const latest = await tx.eventSeatMapVersion.findFirst({ where: { eventId }, orderBy: { version: 'desc' }, select: { version: true } })
    const version = (latest?.version ?? 0) + 1
    const map = await tx.eventSeatMapVersion.create({ data: { eventId, ticketingId: config.id, version, name: input.name.trim(), layout: asJson({ coordinateSystem: 'grid', version }), status: 'PUBLISHED', publishedAt: new Date(), seats: { create: input.seats.map((seat) => ({ eventId, ticketTypeId: seat.ticketTypeId ?? null, seatKey: `${version}:${seat.seatKey.trim()}`, section: seat.section?.trim() || null, rowLabel: seat.rowLabel?.trim() || null, seatNumber: seat.seatNumber.trim(), x: seat.x, y: seat.y, status: 'AVAILABLE' })) } }, include: { seats: true } })
    if (previous) await tx.eventSeatMapVersion.update({ where: { id: previous.id }, data: { status: 'ARCHIVED' } })
    return map
  })
}

export async function configureEventTicketing(actorId: string, eventId: string, input: ConfigureTicketingInput, isAdmin = false) {
  if (!(await canManageEvent(actorId, eventId, isAdmin))) throw new TicketingError(TICKETING_ERROR_CODES.FORBIDDEN, 'No tienes permiso para configurar este evento.', 403)
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, userId: true, venueId: true, status: true, user: { select: { role: true } } } })
  if (!event) throw new TicketingError(TICKETING_ERROR_CODES.NOT_FOUND, 'Evento no encontrado.', 404)

  if (input.mode === 'EXTERNAL') {
    if (!input.externalUrl) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'La URL externa es obligatoria.')
    input.externalUrl = assertHttpsUrl(input.externalUrl)
  }
  if (input.mode === 'INTERNAL') {
    const plan = await planForEvent(event)
    if (!isAdmin && !isPlanAllowed(plan, 'eventTicketingEnabled')) {
      throw new TicketingError(TICKETING_ERROR_CODES.PLAN_REQUIRED, 'La venta interna requiere el plan Plus o superior.', 403, { plan: plan.slug, recommendedPlan: 'plus' })
    }
  }
  const sellerType = input.sellerType ?? 'ORGANIZER'
  if (sellerType === 'PLATFORM' && !isAdmin) throw new TicketingError(TICKETING_ERROR_CODES.FORBIDDEN, 'Solo administración puede usar la cuenta central.', 403)
  if (input.feePercentBps !== undefined) assertNonNegativeInteger(input.feePercentBps, 'El porcentaje de comisión')
  if (input.feeFixedCents !== undefined) assertNonNegativeInteger(input.feeFixedCents, 'La comisión fija')

  let paymentAccountId = input.paymentAccountId ?? null
  if (input.mode === 'INTERNAL' && sellerType === 'ORGANIZER') {
    const account = await getBusinessAccountForUser(event.userId)
    if (!account) throw new TicketingError(TICKETING_ERROR_CODES.PAYMENT_ACCOUNT_REQUIRED, 'El organizador aún no tiene una cuenta empresarial.', 409)
    if (paymentAccountId) {
      const paymentAccount = await prisma.organizerPaymentAccount.findFirst({ where: { id: paymentAccountId, businessAccountId: account.id }, select: { id: true, status: true } })
      if (!paymentAccount) throw new TicketingError(TICKETING_ERROR_CODES.PAYMENT_ACCOUNT_REQUIRED, 'La cuenta de pagos no pertenece al organizador.', 403)
      if (paymentAccount.status !== 'ACTIVE') throw new TicketingError(TICKETING_ERROR_CODES.PAYMENT_ACCOUNT_INACTIVE, 'La cuenta de pagos no está activa.', 409)
    } else {
      throw new TicketingError(TICKETING_ERROR_CODES.PAYMENT_ACCOUNT_REQUIRED, 'Selecciona una cuenta PayPhone activa.', 409)
    }
  }

  return prisma.eventTicketingConfig.upsert({
    where: { eventId },
    update: {
      mode: input.mode,
      sellerType,
      paymentAccountId: input.mode === 'INTERNAL' ? paymentAccountId : null,
      externalUrl: input.mode === 'EXTERNAL' ? input.externalUrl : null,
      externalProviderLabel: input.mode === 'EXTERNAL' ? input.externalProviderLabel ?? null : null,
      feeIncidence: input.mode === 'INTERNAL' ? input.feeIncidence ?? 'NONE' : 'NONE',
      feePercentBps: input.mode === 'INTERNAL' ? input.feePercentBps ?? 0 : 0,
      feeFixedCents: input.mode === 'INTERNAL' ? input.feeFixedCents ?? 0 : 0,
      salesStartAt: input.salesStartAt ?? null,
      salesEndAt: input.salesEndAt ?? null,
      status: input.status ?? (input.mode === 'NONE' ? 'DRAFT' : 'READY'),
    },
    create: {
      eventId,
      mode: input.mode,
      sellerType,
      paymentAccountId: input.mode === 'INTERNAL' ? paymentAccountId : null,
      externalUrl: input.mode === 'EXTERNAL' ? input.externalUrl : null,
      externalProviderLabel: input.mode === 'EXTERNAL' ? input.externalProviderLabel ?? null : null,
      feeIncidence: input.mode === 'INTERNAL' ? input.feeIncidence ?? 'NONE' : 'NONE',
      feePercentBps: input.mode === 'INTERNAL' ? input.feePercentBps ?? 0 : 0,
      feeFixedCents: input.mode === 'INTERNAL' ? input.feeFixedCents ?? 0 : 0,
      salesStartAt: input.salesStartAt ?? null,
      salesEndAt: input.salesEndAt ?? null,
      status: input.status ?? (input.mode === 'NONE' ? 'DRAFT' : 'READY'),
    },
  })
}

export async function replaceTicketTypes(actorId: string, eventId: string, inputs: TicketTypeInput[], isAdmin = false) {
  if (!(await canManageEvent(actorId, eventId, isAdmin))) throw new TicketingError(TICKETING_ERROR_CODES.FORBIDDEN, 'No tienes permiso para configurar este evento.', 403)
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, userId: true, venueId: true } })
  const config = await prisma.eventTicketingConfig.findUnique({ where: { eventId } })
  if (!event || !config || config.mode !== 'INTERNAL') throw new TicketingError(TICKETING_ERROR_CODES.MODE_NOT_INTERNAL, 'El evento no tiene venta interna.', 409)
  const plan = await planForEvent(event)
  if (!isAdmin && !isPlanAllowed(plan, 'eventTicketingEnabled')) throw new TicketingError(TICKETING_ERROR_CODES.PLAN_REQUIRED, 'La venta interna requiere el plan Plus o superior.', 403)
  if (!inputs.length) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Debes configurar al menos un tipo de boleto.')
  const slugs = new Set<string>()
  for (const input of inputs) {
    if (slugs.has(input.slug) || !/^[a-z0-9-]{2,60}$/.test(input.slug)) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Los identificadores de boleto no son válidos.')
    slugs.add(input.slug)
    if (!input.name.trim() || input.priceCents < 0 || !Number.isInteger(input.priceCents)) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'El nombre o precio del boleto no es válido.')
    if (input.capacity !== null && input.capacity !== undefined && (!Number.isInteger(input.capacity) || input.capacity < 1)) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'El cupo no es válido.')
    if (!Number.isInteger(input.minPerOrder ?? 1) || !Number.isInteger(input.maxPerOrder ?? DEFAULT_MAX_TICKETS_PER_ORDER) || (input.minPerOrder ?? 1) < 1 || (input.maxPerOrder ?? DEFAULT_MAX_TICKETS_PER_ORDER) < (input.minPerOrder ?? 1)) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Los límites por orden no son válidos.')
    if (input.kind === 'ASSIGNED_SEAT' && !isAdmin && !isPlanAllowed(plan, 'seatMapsEnabled')) throw new TicketingError(TICKETING_ERROR_CODES.PLAN_REQUIRED, 'Los mapas de asientos requieren el plan Pro o Enterprise.', 403, { plan: plan.slug, recommendedPlan: 'pro' })
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.ticketType.findMany({ where: { eventId }, select: { id: true, soldCount: true, heldCount: true, slug: true, priceCents: true, capacity: true, kind: true, isActive: true } })
    const incomingIds = new Set(inputs.flatMap((input) => input.id ? [input.id] : []))
    for (const old of existing) {
      if (!incomingIds.has(old.id) && !slugs.has(old.slug) && (old.soldCount > 0 || old.heldCount > 0)) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'No puedes eliminar un boleto con ventas o reservas.')
    }
    for (const input of inputs) {
      if (input.id) {
        const old = existing.find((value) => value.id === input.id)
        if (!old) throw new TicketingError(TICKETING_ERROR_CODES.NOT_FOUND, 'Tipo de boleto no encontrado.', 404)
        if (old.soldCount > 0 && input.priceCents !== old.priceCents) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'No puedes cambiar el precio de un boleto ya vendido.')
        if ((old.soldCount > 0 || old.heldCount > 0) && input.kind !== old.kind) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'No puedes cambiar la modalidad de un boleto con ventas o reservas.')
        const nextCapacity = input.capacity ?? null
        if (nextCapacity !== null && nextCapacity < old.soldCount + old.heldCount) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'El cupo no puede ser menor que las ventas y reservas existentes.')
        await tx.ticketType.update({ where: { id: input.id }, data: { slug: input.slug, name: input.name.trim(), description: input.description ?? null, kind: input.kind, priceCents: input.priceCents, capacity: input.capacity ?? null, minPerOrder: input.minPerOrder ?? 1, maxPerOrder: input.maxPerOrder ?? DEFAULT_MAX_TICKETS_PER_ORDER, salesStartAt: input.salesStartAt ?? null, salesEndAt: input.salesEndAt ?? null, sortOrder: input.sortOrder ?? 0, isActive: input.isActive ?? true } })
      } else {
        await tx.ticketType.create({ data: { eventId, ticketingId: config.id, slug: input.slug, name: input.name.trim(), description: input.description ?? null, kind: input.kind, priceCents: input.priceCents, capacity: input.capacity ?? null, minPerOrder: input.minPerOrder ?? 1, maxPerOrder: input.maxPerOrder ?? DEFAULT_MAX_TICKETS_PER_ORDER, salesStartAt: input.salesStartAt ?? null, salesEndAt: input.salesEndAt ?? null, sortOrder: input.sortOrder ?? 0, isActive: input.isActive ?? true } })
      }
    }
    for (const old of existing) {
      if (!incomingIds.has(old.id) && !slugs.has(old.slug) && old.soldCount === 0 && old.heldCount === 0 && old.isActive) {
        await tx.ticketType.update({ where: { id: old.id }, data: { isActive: false } })
      }
    }
    return tx.ticketType.findMany({ where: { eventId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function saveOrganizerPayphoneAccount(input: { actorId: string; storeId: string; token: string; displayName?: string | null; merchantReference?: string | null }) {
  if (!input.storeId.trim() || !input.token.trim()) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Store ID y token son obligatorios.')
  const account = await getBusinessAccountForUser(input.actorId) ?? await ensureBusinessAccount(input.actorId)
  const encrypted = encryptSecret(input.token.trim())
  return prisma.organizerPaymentAccount.upsert({
    where: { businessAccountId_provider_storeId: { businessAccountId: account.id, provider: 'PAYPHONE', storeId: input.storeId.trim() } },
    update: { displayName: input.displayName?.trim() || null, merchantReference: input.merchantReference?.trim() || null, credentialCiphertext: encrypted.ciphertext, credentialIv: encrypted.iv, credentialAuthTag: encrypted.authTag, credentialKeyVersion: encrypted.keyVersion, status: 'ACTIVE', lastVerifiedAt: new Date() },
    create: { businessAccountId: account.id, provider: 'PAYPHONE', storeId: input.storeId.trim(), displayName: input.displayName?.trim() || null, merchantReference: input.merchantReference?.trim() || null, credentialCiphertext: encrypted.ciphertext, credentialIv: encrypted.iv, credentialAuthTag: encrypted.authTag, credentialKeyVersion: encrypted.keyVersion, status: 'ACTIVE', lastVerifiedAt: new Date(), capabilities: { checkout: true, webhooks: false, refunds: false, split: false } },
    select: { id: true, provider: true, storeId: true, displayName: true, status: true, capabilities: true, lastVerifiedAt: true },
  })
}

export async function listOrganizerPayphoneAccounts(actorId: string) {
  const account = await getBusinessAccountForUser(actorId)
  if (!account) return []
  return prisma.organizerPaymentAccount.findMany({ where: { businessAccountId: account.id }, select: { id: true, provider: true, storeId: true, displayName: true, status: true, capabilities: true, lastVerifiedAt: true }, orderBy: { createdAt: 'asc' } })
}

async function credentialsForConfig(config: { sellerType: string; paymentAccountId: string | null }) : Promise<PayphoneCredentials> {
  if (config.sellerType === 'PLATFORM') {
    const token = process.env.PAYPHONE_TOKEN
    const storeId = process.env.PAYPHONE_STORE_ID
    if (!token || !storeId) throw new TicketingError(TICKETING_ERROR_CODES.PAYMENT_NOT_CONFIGURED, 'La cuenta PayPhone central no está configurada.', 503)
    return { token, storeId }
  }
  if (!config.paymentAccountId) throw new TicketingError(TICKETING_ERROR_CODES.PAYMENT_ACCOUNT_REQUIRED, 'La cuenta PayPhone del organizador no está configurada.', 409)
  const account = await prisma.organizerPaymentAccount.findUnique({ where: { id: config.paymentAccountId } })
  if (!account || account.status !== 'ACTIVE') throw new TicketingError(TICKETING_ERROR_CODES.PAYMENT_ACCOUNT_INACTIVE, 'La cuenta PayPhone no está activa.', 409)
  return { token: decryptSecret({ ciphertext: account.credentialCiphertext, iv: account.credentialIv, authTag: account.credentialAuthTag }), storeId: account.storeId }
}

async function credentialsForOrder(orderId: string) {
  const order = await prisma.ticketOrder.findUnique({ where: { id: orderId }, select: { id: true, ticketing: { select: { sellerType: true, paymentAccountId: true } } } })
  if (!order) throw new TicketingError(TICKETING_ERROR_CODES.ORDER_NOT_FOUND, 'Orden no encontrada.', 404)
  return { order, credentials: await credentialsForConfig(order.ticketing) }
}

async function serializable<T>(fn: (tx: Db) => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }) }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < attempts - 1) continue
      throw error
    }
  }
  throw new Error('Serializable transaction retries exhausted')
}

async function releaseHoldTx(tx: Db, holdId: string, status: 'EXPIRED' | 'RELEASED') {
  const hold = await tx.ticketHold.findUnique({ where: { id: holdId }, include: { items: true } })
  if (!hold || hold.status !== 'ACTIVE') return false
  for (const item of hold.items) {
    if (item.eventSeatId) {
      await tx.eventSeat.updateMany({ where: { id: item.eventSeatId, status: 'HELD' }, data: { status: 'AVAILABLE' } })
    } else {
      await tx.ticketType.update({ where: { id: item.ticketTypeId }, data: { heldCount: { decrement: item.quantity } } })
    }
  }
  await tx.ticketHold.update({ where: { id: holdId }, data: { status } })
  await tx.ticketOrder.updateMany({ where: { holdId, status: 'PENDING_PAYMENT' }, data: { status: 'EXPIRED' } })
  return true
}

export async function expireTicketHolds(limit = 100) {
  const holds = await prisma.ticketHold.findMany({ where: { status: 'ACTIVE', expiresAt: { lte: new Date() } }, orderBy: { expiresAt: 'asc' }, take: limit, select: { id: true } })
  let released = 0
  for (const hold of holds) if (await serializable((tx) => releaseHoldTx(tx, hold.id, 'EXPIRED'))) released += 1
  return { found: holds.length, released }
}

export async function releaseTicketHold(token: string) {
  const hold = await prisma.ticketHold.findUnique({ where: { publicTokenHash: hashSecret(token) }, select: { id: true, status: true } })
  if (!hold) throw new TicketingError(TICKETING_ERROR_CODES.HOLD_EXPIRED, 'La selección no existe o expiró.', 409)
  if (hold.status === 'ACTIVE') await serializable((tx) => releaseHoldTx(tx, hold.id, 'RELEASED'))
  return { released: true }
}

export async function createTicketHold(input: { eventSlug: string; items: TicketSelection[]; sessionKey: string; idempotencyKey?: string; buyerUserId?: string | null }) {
  if (!input.sessionKey.trim() || input.sessionKey.length > 160) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'La sesión de compra no es válida.')
  if (!input.items.length || input.items.length > 50) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Selecciona al menos un boleto.')
  const previous = input.idempotencyKey ? await prisma.ticketHold.findUnique({ where: { sessionKey_idempotencyKey: { sessionKey: input.sessionKey, idempotencyKey: input.idempotencyKey } }, select: { id: true, publicTokenLast4: true, publicTokenCiphertext: true, publicTokenIv: true, publicTokenAuthTag: true, expiresAt: true, status: true } }) : null
  if (previous) {
    if (previous.status !== 'ACTIVE' && previous.status !== 'CONVERTED') throw new TicketingError(TICKETING_ERROR_CODES.HOLD_EXPIRED, 'Esta selección ya expiró. Crea una nueva selección.', 409)
    const token = previous.publicTokenCiphertext && previous.publicTokenIv && previous.publicTokenAuthTag
      ? decryptSecret({ ciphertext: previous.publicTokenCiphertext, iv: previous.publicTokenIv, authTag: previous.publicTokenAuthTag })
      : null
    if (!token) throw new TicketingError(TICKETING_ERROR_CODES.HOLD_EXPIRED, 'No se pudo recuperar la selección. Crea una nueva selección.', 409)
    return { id: previous.id, token, tokenLast4: previous.publicTokenLast4, expiresAt: previous.expiresAt, idempotent: true }
  }

  const event = await getEventWithTicketing({ slug: input.eventSlug })
  if (!event || event.status !== 'APPROVED') throw new TicketingError(TICKETING_ERROR_CODES.NOT_FOUND, 'Evento no encontrado.', 404)
  const config = event.ticketingConfig
  if (!config || config.mode !== 'INTERNAL') throw new TicketingError(TICKETING_ERROR_CODES.MODE_NOT_INTERNAL, 'Este evento no vende entradas dentro de Vive Loja.', 409)
  assertSaleOpen(config)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + DEFAULT_HOLD_MINUTES * 60_000)
  const totalQuantity = input.items.reduce((sum, item) => sum + item.quantity, 0)
  if (totalQuantity < 1 || totalQuantity > DEFAULT_MAX_TICKETS_PER_ORDER) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, `Puedes reservar entre 1 y ${DEFAULT_MAX_TICKETS_PER_ORDER} entradas.`)
  const token = createPublicToken()
  const encryptedToken = encryptSecret(token.token)

  const result = await serializable(async (tx) => {
    const currentConfig = await tx.eventTicketingConfig.findUnique({ where: { eventId: event.id }, select: { id: true, mode: true, status: true, salesStartAt: true, salesEndAt: true } })
    if (!currentConfig || currentConfig.mode !== 'INTERNAL') throw new TicketingError(TICKETING_ERROR_CODES.MODE_NOT_INTERNAL, 'Este evento no vende entradas dentro de Vive Loja.', 409)
    assertSaleOpen(currentConfig, now)
    const types = await tx.ticketType.findMany({ where: { id: { in: input.items.map((item) => item.ticketTypeId) }, eventId: event.id, isActive: true } })
    if (types.length !== new Set(input.items.map((item) => item.ticketTypeId)).size) throw new TicketingError(TICKETING_ERROR_CODES.NOT_FOUND, 'Uno de los tipos de boleto no existe.', 404)
    const typeById = new Map(types.map((type) => [type.id, type]))
    const holdItems: Array<{ ticketTypeId: string; eventSeatId?: string; quantity: number; unitPriceCents: number }> = []
    let quantity = 0
    for (const selection of input.items) {
      if (!Number.isInteger(selection.quantity) || selection.quantity < 1) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'La cantidad de boletos no es válida.')
      const type = typeById.get(selection.ticketTypeId)
      if (!type) throw new TicketingError(TICKETING_ERROR_CODES.NOT_FOUND, 'Tipo de boleto no encontrado.', 404)
      if (selection.quantity < type.minPerOrder || selection.quantity > type.maxPerOrder) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, `La cantidad de ${type.name} no está dentro de los límites.`)
      const seats = selection.eventSeatIds ?? []
      if (type.kind === 'ASSIGNED_SEAT') {
        if (seats.length !== selection.quantity || new Set(seats).size !== seats.length) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Selecciona exactamente un asiento por boleto.')
        const seatRows = await tx.eventSeat.findMany({ where: { id: { in: seats }, eventId: event.id }, select: { id: true, status: true, ticketTypeId: true } })
        if (seatRows.length !== seats.length || seatRows.some((seat) => seat.status !== 'AVAILABLE' || (seat.ticketTypeId && seat.ticketTypeId !== type.id))) throw new TicketingError(TICKETING_ERROR_CODES.SEAT_UNAVAILABLE, 'Uno de los asientos ya no está disponible.', 409)
        for (const seat of seatRows) {
          const updated = await tx.eventSeat.updateMany({ where: { id: seat.id, status: 'AVAILABLE' }, data: { status: 'HELD' } })
          if (updated.count !== 1) throw new TicketingError(TICKETING_ERROR_CODES.SEAT_UNAVAILABLE, 'Uno de los asientos ya no está disponible.', 409)
          holdItems.push({ ticketTypeId: type.id, eventSeatId: seat.id, quantity: 1, unitPriceCents: type.priceCents })
        }
      } else {
        const current = await tx.ticketType.findUniqueOrThrow({ where: { id: type.id }, select: { capacity: true, heldCount: true, soldCount: true } })
        if (current.capacity !== null && current.heldCount + current.soldCount + selection.quantity > current.capacity) throw new TicketingError(TICKETING_ERROR_CODES.SOLD_OUT, `No hay suficientes entradas de ${type.name}.`, 409)
        await tx.ticketType.update({ where: { id: type.id }, data: { heldCount: { increment: selection.quantity } } })
        holdItems.push({ ticketTypeId: type.id, quantity: selection.quantity, unitPriceCents: type.priceCents })
      }
      quantity += selection.quantity
    }
    if (quantity > DEFAULT_MAX_TICKETS_PER_ORDER) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, `Puedes reservar entre 1 y ${DEFAULT_MAX_TICKETS_PER_ORDER} entradas.`)
    const hold = await tx.ticketHold.create({ data: { eventId: event.id, ticketingId: currentConfig.id, publicTokenHash: token.hash, publicTokenLast4: token.last4, publicTokenCiphertext: encryptedToken.ciphertext, publicTokenIv: encryptedToken.iv, publicTokenAuthTag: encryptedToken.authTag, publicTokenKeyVersion: encryptedToken.keyVersion, sessionKey: input.sessionKey, idempotencyKey: input.idempotencyKey ?? null, buyerUserId: input.buyerUserId ?? null, expiresAt, items: { create: holdItems } }, select: { id: true, expiresAt: true } })
    return { id: hold.id, expiresAt: hold.expiresAt }
  })
  return { ...result, token: token.token, tokenLast4: token.last4, idempotent: false }
}

function effectiveFee(config: { sellerType: string; feeIncidence: string; feePercentBps: number; feeFixedCents: number; paymentAccount: { capabilities: Prisma.JsonValue | null } | null }) {
  const requested = config.feeIncidence !== 'NONE' && (config.feePercentBps > 0 || config.feeFixedCents > 0)
  const capabilities = config.paymentAccount?.capabilities
  const split = !!capabilities && typeof capabilities === 'object' && !Array.isArray(capabilities) && (capabilities as Record<string, unknown>).split === true
  if (config.sellerType === 'ORGANIZER' && requested && !split) return { incidence: 'NONE', split: false }
  return { incidence: requested ? config.feeIncidence : 'NONE', split: config.sellerType === 'PLATFORM' || split }
}

export async function createTicketCheckout(input: { holdToken: string; buyerName: string; buyerEmail: string; buyerPhone: string; billingDocumentId?: string | null; idempotencyKey?: string }) {
  const hold = await prisma.ticketHold.findUnique({ where: { publicTokenHash: hashSecret(input.holdToken) }, include: { order: true, ticketing: { include: { paymentAccount: true } }, event: { select: { id: true, title: true, slug: true } }, items: { include: { ticketType: true, eventSeat: true } } } })
  if (!hold) throw new TicketingError(TICKETING_ERROR_CODES.HOLD_EXPIRED, 'La selección no existe o expiró.', 409)
  if (hold.order) return serializeOrderForCheckout(hold.order, input.holdToken)
  if (hold.status !== 'ACTIVE' || hold.expiresAt <= new Date()) {
    await expireTicketHolds(10)
    throw new TicketingError(TICKETING_ERROR_CODES.HOLD_EXPIRED, 'La selección expiró. Vuelve a elegir tus entradas.', 409)
  }
  if (!input.buyerName.trim() || !input.buyerEmail.includes('@') || !input.buyerPhone.trim()) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Nombre, correo y teléfono son obligatorios.')
  const payphonePhone = normalizePayphonePhone(input.buyerPhone)
  const feePolicy = effectiveFee(hold.ticketing)
  const subtotalCents = hold.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0)
  const platformFeeCents = feePolicy.incidence === 'NONE' ? 0 : calculatePlatformFee(subtotalCents, hold.ticketing.feePercentBps, hold.ticketing.feeFixedCents)
  const totalCents = feePolicy.incidence === 'ORGANIZER_ABSORBS' ? subtotalCents : subtotalCents + platformFeeCents
  const clientTransactionId = `vl_${randomBytes(16).toString('hex')}`

  const order = await serializable(async (tx) => {
    const current = await tx.ticketHold.findUnique({ where: { id: hold.id }, include: { order: true } })
    if (!current) throw new TicketingError(TICKETING_ERROR_CODES.HOLD_EXPIRED, 'La selección expiró. Vuelve a elegir tus entradas.', 409)
    if (current.order) return current.order
    if (current.status !== 'ACTIVE' || current.expiresAt <= new Date()) throw new TicketingError(TICKETING_ERROR_CODES.HOLD_EXPIRED, 'La selección expiró. Vuelve a elegir tus entradas.', 409)
    return tx.ticketOrder.create({ data: { eventId: hold.eventId, ticketingId: hold.ticketingId, holdId: hold.id, buyerUserId: current.buyerUserId, sellerAccountId: hold.ticketing.paymentAccount?.businessAccountId ?? null, publicTokenHash: hold.publicTokenHash, publicTokenLast4: hold.publicTokenLast4, clientTransactionId, provider: 'PAYPHONE', subtotalCents, platformFeeCents, totalCents, buyerName: input.buyerName.trim(), buyerEmail: normalizedEmail(input.buyerEmail), buyerPhone: payphonePhone, billingDocumentId: input.billingDocumentId?.trim() || null, expiresAt: current.expiresAt, items: { create: hold.items.map((item) => ({ ticketTypeId: item.ticketTypeId, eventSeatId: item.eventSeatId, kindSnapshot: item.ticketType.kind, nameSnapshot: item.ticketType.name, seatLabel: item.eventSeat ? seatLabel(item.eventSeat) : null, unitPriceCents: item.unitPriceCents, quantity: item.quantity, subtotalCents: item.unitPriceCents * item.quantity })) }, payments: { create: { provider: 'PAYPHONE', clientTransactionId, status: 'CREATED', amountCents: totalCents } } } })
  })

  const orderWithItems = await prisma.ticketOrder.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } })
  if (orderWithItems.status !== 'PENDING_PAYMENT') return serializeOrderForCheckout(orderWithItems, input.holdToken)
  if (orderWithItems.totalCents === 0) {
    await markOrderPaid(orderWithItems.id, { approved: true, clientTransactionId: orderWithItems.clientTransactionId, transactionId: 'FREE', amountCents: 0, currency: orderWithItems.currency, status: 'FREE', statusCode: 3, raw: { provider: 'FREE' } })
    const freeOrder = await prisma.ticketOrder.findUniqueOrThrow({ where: { id: orderWithItems.id } })
    return serializeOrderForCheckout(freeOrder, input.holdToken)
  }
  let checkout
  try {
    const credentials = await credentialsForConfig(hold.ticketing)
    checkout = await preparePayphoneCheckout({ credentials, clientTransactionId: orderWithItems.clientTransactionId, amountCents: orderWithItems.totalCents, reference: hold.event.title, responseUrl: `${appUrl()}/api/ticketing/payphone/return?token=${encodeURIComponent(input.holdToken)}`, cancellationUrl: `${appUrl()}/checkout/result?token=${encodeURIComponent(input.holdToken)}&cancelled=1`, buyer: { name: orderWithItems.buyerName, email: orderWithItems.buyerEmail, phone: orderWithItems.buyerPhone, documentId: orderWithItems.billingDocumentId }, lineItems: orderWithItems.items.map((item) => ({ name: item.nameSnapshot, unitPriceCents: item.unitPriceCents, quantity: item.quantity, totalCents: item.subtotalCents, sku: item.ticketTypeId })) })
  } catch (error) {
    await serializable((tx) => releaseHoldTx(tx, hold.id, 'RELEASED'))
    throw error
  }
  const updated = await prisma.$transaction(async (tx) => {
    await tx.ticketOrder.update({ where: { id: orderWithItems.id }, data: { checkoutUrl: checkout.payWithCard ?? checkout.payWithPayPhone, providerPaymentId: checkout.paymentId } })
    await tx.ticketPaymentAttempt.updateMany({ where: { orderId: orderWithItems.id, clientTransactionId: orderWithItems.clientTransactionId }, data: { providerPaymentId: checkout.paymentId, status: 'REDIRECTED', rawResponse: asJson(checkout.raw) } })
    return tx.ticketOrder.findUniqueOrThrow({ where: { id: orderWithItems.id } })
  })
  return { ...serializeOrderForCheckout(updated, input.holdToken), checkoutUrl: checkout.payWithCard ?? checkout.payWithPayPhone, payWithCard: checkout.payWithCard, payWithPayPhone: checkout.payWithPayPhone }
}

function serializeOrderForCheckout(order: { id: string; status: string; publicTokenLast4: string; expiresAt: Date; checkoutUrl: string | null; totalCents: number; currency: string; clientTransactionId: string }, holdToken: string) {
  return { orderId: order.id, status: order.status, token: holdToken, tokenLast4: order.publicTokenLast4, expiresAt: order.expiresAt, checkoutUrl: order.checkoutUrl, totalCents: order.totalCents, currency: order.currency, clientTransactionId: order.clientTransactionId }
}

function newTicketCode() {
  return `VL-${randomBytes(8).toString('hex').toUpperCase()}`
}

function publicTicket(ticket: { id: string; code: string; seatLabel: string | null; status: string; issuedAt: Date; qrTokenCiphertext: string; qrTokenIv: string; qrTokenAuthTag: string; event: { slug: string }; ticketType: { name: string; kind: string } }) {
  const token = decryptSecret({ ciphertext: ticket.qrTokenCiphertext, iv: ticket.qrTokenIv, authTag: ticket.qrTokenAuthTag })
  return { id: ticket.id, code: ticket.code, qrData: `${appUrl()}/tickets/scan?token=${encodeURIComponent(token)}`, qrImageUrl: `${appUrl()}/api/ticketing/qr?token=${encodeURIComponent(token)}`, seatLabel: ticket.seatLabel, status: ticket.status, issuedAt: ticket.issuedAt, ticketType: ticket.ticketType }
}

async function markOrderPaid(orderId: string, payment: NormalizedPayphonePayment) {
  const result = await serializable(async (tx) => {
    const order = await tx.ticketOrder.findUnique({ where: { id: orderId }, include: { items: true, hold: { include: { items: true } } } })
    if (!order) throw new TicketingError(TICKETING_ERROR_CODES.ORDER_NOT_FOUND, 'Orden no encontrada.', 404)
    if (order.status === 'PAID') return { orderId, outboxId: null, alreadyPaid: true }
    if (order.status !== 'PENDING_PAYMENT') return { orderId, outboxId: null, alreadyPaid: false }
    if (order.expiresAt <= new Date() || order.hold.status !== 'ACTIVE') {
      await tx.ticketOrder.update({ where: { id: order.id }, data: { status: 'DISPUTED', failureCode: 'PAID_AFTER_HOLD_EXPIRY', providerStatus: payment.status } })
      await tx.ticketingAuditLog.create({ data: { eventId: order.eventId, orderId: order.id, action: 'PAYMENT_AFTER_HOLD_EXPIRY', metadata: asJson(payment.raw) } })
      throw new TicketingError(TICKETING_ERROR_CODES.PAYMENT_MISMATCH, 'El pago llegó después de expirar la reserva y requiere revisión.', 409)
    }
    await tx.ticketOrder.update({ where: { id: order.id }, data: { status: 'PAID', providerPaymentId: payment.transactionId, providerStatus: payment.status, paidAt: new Date() } })
    await tx.ticketPaymentAttempt.updateMany({ where: { orderId: order.id, clientTransactionId: order.clientTransactionId }, data: { status: 'SUCCEEDED', providerPaymentId: payment.transactionId, providerStatus: payment.status, rawResponse: asJson(payment.raw) } })
    await tx.ticketHold.update({ where: { id: order.holdId }, data: { status: 'CONVERTED' } })
    for (const item of order.hold.items) {
      if (item.eventSeatId) await tx.eventSeat.updateMany({ where: { id: item.eventSeatId, status: 'HELD' }, data: { status: 'SOLD' } })
      else await tx.ticketType.update({ where: { id: item.ticketTypeId }, data: { heldCount: { decrement: item.quantity }, soldCount: { increment: item.quantity } } })
    }
    for (const item of order.items) {
      for (let index = 0; index < item.quantity; index += 1) {
        const qrToken = createPublicToken()
        const encrypted = encryptSecret(qrToken.token)
        await tx.ticket.create({ data: { orderId: order.id, eventId: order.eventId, ticketTypeId: item.ticketTypeId, orderItemId: item.id, eventSeatId: item.eventSeatId, code: newTicketCode(), qrTokenHash: qrToken.hash, qrTokenLast4: qrToken.last4, qrTokenCiphertext: encrypted.ciphertext, qrTokenIv: encrypted.iv, qrTokenAuthTag: encrypted.authTag, qrTokenKeyVersion: encrypted.keyVersion, seatLabel: item.seatLabel } })
      }
    }
    await tx.ticketingLedgerEntry.createMany({ data: [{ orderId: order.id, entryType: 'SALE', amountCents: order.subtotalCents, currency: order.currency }, ...(order.platformFeeCents > 0 ? [{ orderId: order.id, entryType: 'PLATFORM_FEE', amountCents: order.platformFeeCents, currency: order.currency }] : [])] })
    const outbox = await tx.ticketingOutbox.create({ data: { orderId: order.id, kind: 'SEND_TICKETS', dedupeKey: `send-tickets:${order.id}`, payload: { orderId: order.id } }, select: { id: true } })
    return { orderId: order.id, outboxId: outbox.id, alreadyPaid: false }
  })
  if (result.outboxId) {
    try {
      const published = await publishTicketOutbox(result.outboxId)
      // QStash is optional. Without it, deliver synchronously so a successful
      // purchase does not wait for the next cron run. The outbox row remains
      // retryable if Resend has a transient failure.
      if (!published) await processTicketingOutbox(result.outboxId)
    } catch (error) {
      console.error('[ticketing] ticket delivery deferred for retry', error)
    }
  }
  return result
}

async function markOrderFailed(orderId: string, payment: NormalizedPayphonePayment) {
  await serializable(async (tx) => {
    const order = await tx.ticketOrder.findUnique({ where: { id: orderId }, select: { status: true, holdId: true } })
    if (!order || order.status === 'PAID') return
    if (order.status === 'PENDING_PAYMENT') {
      await tx.ticketOrder.update({ where: { id: orderId }, data: { status: 'FAILED', providerStatus: payment.status, failureCode: `PAYPHONE_${payment.statusCode ?? 'UNKNOWN'}` } })
      await releaseHoldTx(tx, order.holdId, 'RELEASED')
    }
  })
}

async function validatePayment(orderId: string, payment: NormalizedPayphonePayment) {
  const order = await prisma.ticketOrder.findUnique({ where: { id: orderId }, select: { totalCents: true, currency: true, clientTransactionId: true } })
  if (!order) throw new TicketingError(TICKETING_ERROR_CODES.ORDER_NOT_FOUND, 'Orden no encontrada.', 404)
  if (payment.clientTransactionId !== order.clientTransactionId || payment.amountCents !== order.totalCents || payment.currency !== order.currency) {
    await prisma.ticketOrder.update({ where: { id: orderId }, data: { status: 'DISPUTED', failureCode: 'PAYMENT_DATA_MISMATCH', providerStatus: payment.status } }).catch(() => undefined)
    throw new TicketingError(TICKETING_ERROR_CODES.PAYMENT_MISMATCH, 'Los datos del pago no coinciden con la orden.', 409)
  }
  if (payment.approved) return markOrderPaid(orderId, payment)
  await markOrderFailed(orderId, payment)
  throw new TicketingError(TICKETING_ERROR_CODES.PAYMENT_FAILED, 'El pago no fue aprobado.', 402)
}

export async function confirmTicketPayment(clientTransactionId: string, transactionId: string) {
  const order = await prisma.ticketOrder.findUnique({ where: { clientTransactionId }, select: { id: true, status: true } })
  if (!order) throw new TicketingError(TICKETING_ERROR_CODES.ORDER_NOT_FOUND, 'Orden no encontrada.', 404)
  if (order.status === 'PAID') return { orderId: order.id, status: 'PAID', alreadyPaid: true }
  const { credentials } = await credentialsForOrder(order.id)
  const payment = await confirmPayphonePayment(credentials, transactionId, clientTransactionId)
  return { ...(await validatePayment(order.id, payment)), status: payment.approved ? 'PAID' : 'FAILED' }
}

export async function processPayphoneNotification(payload: unknown) {
  const notification = parsePayphoneNotification(payload)
  if (!notification || !notification.transactionId) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Notificación PayPhone inválida.', 400)
  const order = await prisma.ticketOrder.findUnique({ where: { clientTransactionId: notification.clientTransactionId }, select: { id: true, totalCents: true, currency: true, ticketing: { select: { sellerType: true, paymentAccountId: true } } } })
  if (!order) throw new TicketingError(TICKETING_ERROR_CODES.ORDER_NOT_FOUND, 'Orden no encontrada.', 404)
  const credentials = await credentialsForConfig(order.ticketing)
  const confirmed = await confirmPayphonePayment(credentials, notification.transactionId, notification.clientTransactionId)
  return validatePayment(order.id, confirmed)
}

async function publicTicketOrderForId(orderId: string, includeBuyer = true) {
  const order = await prisma.ticketOrder.findUnique({ where: { id: orderId }, include: { event: { select: { id: true, title: true, slug: true, startDate: true, endDate: true, location: true, address: true } } } }).catch(() => null)
  if (!order) throw new TicketingError(TICKETING_ERROR_CODES.ORDER_NOT_FOUND, 'Orden no encontrada.', 404)
  const tickets = await prisma.ticket.findMany({ where: { orderId: order.id }, select: { ...publicTicketSelect, qrTokenCiphertext: true, qrTokenIv: true, qrTokenAuthTag: true } })
  return {
    id: order.id,
    status: order.status,
    ...(includeBuyer ? { buyerName: order.buyerName, buyerEmail: order.buyerEmail } : {}),
    subtotalCents: order.subtotalCents,
    platformFeeCents: order.platformFeeCents,
    totalCents: order.totalCents,
    currency: order.currency,
    paidAt: order.paidAt,
    event: order.event,
    tickets: tickets.map(publicTicket),
  }
}

export async function getPublicTicketOrder(token: string) {
  const order = await prisma.ticketOrder.findUnique({ where: { publicTokenHash: hashSecret(token) }, select: { id: true } }).catch(() => null)
  if (!order) throw new TicketingError(TICKETING_ERROR_CODES.ORDER_NOT_FOUND, 'Orden no encontrada.', 404)
  return publicTicketOrderForId(order.id)
}

export async function getPublicTicketByQrToken(token: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { qrTokenHash: hashSecret(token) },
    select: {
      code: true,
      seatLabel: true,
      status: true,
      issuedAt: true,
      event: { select: { title: true, slug: true, startDate: true, location: true, address: true } },
      ticketType: { select: { name: true } },
    },
  })
  if (!ticket) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_TICKET, 'Entrada no encontrada.', 404)
  return ticket
}

/**
 * A QR link is already a bearer secret delivered to the ticket holder. The
 * mobile import endpoint may use it to recover the whole purchase, but it does
 * not return buyer PII because the QR can be shown to venue staff.
 */
export async function getPublicTicketOrderByQrToken(token: string) {
  const ticket = await prisma.ticket.findFirst({ where: { qrTokenHash: hashSecret(token), status: { not: 'VOID' } }, select: { orderId: true } })
  if (!ticket) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_TICKET, 'Entrada no encontrada.', 404)
  return publicTicketOrderForId(ticket.orderId, false)
}

export async function getTicketOrderStatus(clientTransactionId: string) {
  const order = await prisma.ticketOrder.findUnique({
    where: { clientTransactionId },
    select: {
      status: true,
      totalCents: true,
      currency: true,
      paidAt: true,
      publicTokenLast4: true,
      event: { select: { title: true, slug: true } },
      _count: { select: { tickets: true } },
    },
  })
  if (!order) throw new TicketingError(TICKETING_ERROR_CODES.ORDER_NOT_FOUND, 'Orden no encontrada.', 404)
  return {
    status: order.status,
    totalCents: order.totalCents,
    currency: order.currency,
    paidAt: order.paidAt,
    tokenLast4: order.publicTokenLast4,
    ticketCount: order._count.tickets,
    event: order.event,
  }
}

export async function claimTicketOrder(token: string, userId: string) {
  const order = await prisma.ticketOrder.findUnique({ where: { publicTokenHash: hashSecret(token) }, select: { id: true, buyerEmail: true, status: true } })
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (!order || !user) throw new TicketingError(TICKETING_ERROR_CODES.ORDER_NOT_FOUND, 'Orden no encontrada.', 404)
  if (normalizedEmail(order.buyerEmail) !== normalizedEmail(user.email)) throw new TicketingError(TICKETING_ERROR_CODES.FORBIDDEN, 'El correo de la cuenta no coincide con la compra.', 403)
  await prisma.ticketOrder.update({ where: { id: order.id }, data: { buyerUserId: userId } })
  return { claimed: true, orderId: order.id, status: order.status }
}

export async function getMyTicketOrders(userId: string) {
  // Web NextAuth and mobile sessions are separate, so an older web purchase
  // can have buyerUserId=null even when its buyer was already signed in. Only
  // an authenticated account can run this reconciliation, and only orders
  // with an exact normalized email match and no existing owner are claimed.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (user) {
    await prisma.ticketOrder.updateMany({
      where: {
        buyerUserId: null,
        buyerEmail: normalizedEmail(user.email),
        status: { in: ['PAID', 'REFUND_PENDING', 'REFUNDED'] },
      },
      data: { buyerUserId: userId },
    })
  }
  const orders = await prisma.ticketOrder.findMany({ where: { buyerUserId: userId, status: { in: ['PAID', 'REFUND_PENDING', 'REFUNDED'] } }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, status: true, totalCents: true, currency: true, paidAt: true, event: { select: { id: true, title: true, slug: true, startDate: true, location: true } } } })
  const tickets = await prisma.ticket.findMany({ where: { order: { buyerUserId: userId }, status: { not: 'VOID' } }, select: { ...publicTicketSelect, orderId: true, qrTokenCiphertext: true, qrTokenIv: true, qrTokenAuthTag: true } })
  return orders.map((order) => ({ ...order, tickets: tickets.filter((ticket) => ticket.orderId === order.id && ticket.status !== 'VOID').map(publicTicket) }))
}

export async function checkInTicket(input: { eventId: string; token: string; scannerUserId: string; deviceId?: string | null }) {
  const qrHash = hashSecret(input.token)
  return serializable(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { qrTokenHash: qrHash },
      select: {
        id: true,
        eventId: true,
        status: true,
        code: true,
        seatLabel: true,
        ticketType: { select: { name: true } },
        order: {
          select: {
            buyerName: true,
            tickets: { select: { id: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
          },
        },
      },
    })
    if (!ticket) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_TICKET, 'El QR no corresponde a una entrada válida.', 404)
    if (ticket.eventId !== input.eventId) throw new TicketingError(TICKETING_ERROR_CODES.WRONG_EVENT, 'Esta entrada pertenece a otro evento.', 409)
    if (ticket.status === 'VOID') throw new TicketingError(TICKETING_ERROR_CODES.INVALID_TICKET, 'Esta entrada está anulada.', 409)
    if (ticket.status === 'CHECKED_IN') {
      await tx.ticketCheckIn.create({ data: { ticketId: ticket.id, eventId: ticket.eventId, scannerUserId: input.scannerUserId, result: 'ALREADY_USED', deviceId: input.deviceId ?? null } })
      throw new TicketingError(TICKETING_ERROR_CODES.ALREADY_CHECKED_IN, 'Esta entrada ya fue utilizada.', 409, { code: ticket.code, seatLabel: ticket.seatLabel })
    }
    const acceptedAt = new Date()
    const updated = await tx.ticket.updateMany({ where: { id: ticket.id, status: 'ISSUED' }, data: { status: 'CHECKED_IN', checkedInAt: acceptedAt } })
    if (updated.count !== 1) throw new TicketingError(TICKETING_ERROR_CODES.ALREADY_CHECKED_IN, 'Esta entrada ya fue utilizada.', 409)
    await tx.ticketCheckIn.create({ data: { ticketId: ticket.id, eventId: ticket.eventId, scannerUserId: input.scannerUserId, result: 'ACCEPTED', deviceId: input.deviceId ?? null } })
    const ticketSequence = ticket.order.tickets.findIndex((orderTicket) => orderTicket.id === ticket.id) + 1
    return {
      result: 'ACCEPTED',
      ticketId: ticket.id,
      code: ticket.code,
      seatLabel: ticket.seatLabel,
      ticketType: ticket.ticketType.name,
      buyerName: ticket.order.buyerName,
      orderTicketCount: ticket.order.tickets.length,
      ticketSequence,
      acceptedAt,
    }
  })
}

export async function canScanEvent(actorId: string, eventId: string, isAdmin = false) {
  if (isAdmin) return true
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { userId: true, venueId: true } })
  if (!event) return false
  if (event.userId === actorId) return true
  if (event.venueId && await canManageVenue(actorId, event.venueId, ['OWNER', 'ADMIN'])) return true
  const staff = await prisma.eventTicketingStaff.findUnique({ where: { eventId_userId: { eventId, userId: actorId } }, select: { permissions: true } })
  return !!staff?.permissions.includes('CHECK_IN')
}

export async function listEventTicketOrders(actorId: string, eventId: string, isAdmin = false) {
  if (!(await canManageEvent(actorId, eventId, isAdmin))) throw new TicketingError(TICKETING_ERROR_CODES.FORBIDDEN, 'No tienes permiso para consultar estas ventas.', 403)
  return prisma.ticketOrder.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
    take: 5000,
    select: {
      id: true,
      status: true,
      buyerName: true,
      buyerEmail: true,
      buyerPhone: true,
      subtotalCents: true,
      platformFeeCents: true,
      totalCents: true,
      refundedCents: true,
      currency: true,
      provider: true,
      providerPaymentId: true,
      paidAt: true,
      createdAt: true,
      items: { select: { nameSnapshot: true, seatLabel: true, quantity: true, unitPriceCents: true, subtotalCents: true } },
      _count: { select: { tickets: true, refunds: true } },
    },
  })
}

export async function requestFullRefund(actorId: string, orderId: string, reason: string, isAdmin = false) {
  const orderReference = await prisma.ticketOrder.findUnique({ where: { id: orderId }, select: { eventId: true } })
  if (!orderReference) throw new TicketingError(TICKETING_ERROR_CODES.REFUND_NOT_AVAILABLE, 'La orden no está disponible para devolución.', 409)
  if (!(await canManageEvent(actorId, orderReference.eventId, isAdmin))) throw new TicketingError(TICKETING_ERROR_CODES.FORBIDDEN, 'No tienes permiso para solicitar esta devolución.', 403)
  if (!reason.trim()) throw new TicketingError(TICKETING_ERROR_CODES.INVALID_INPUT, 'Indica el motivo de la devolución.')

  const prepared = await serializable(async (tx) => {
    const order = await tx.ticketOrder.findUnique({ where: { id: orderId }, include: { ticketing: { include: { paymentAccount: true } }, tickets: { select: { id: true, status: true } } } })
    if (!order) throw new TicketingError(TICKETING_ERROR_CODES.REFUND_NOT_AVAILABLE, 'La orden no está disponible para devolución.', 409)
    if (order.status === 'REFUND_PENDING') {
      const pending = await tx.ticketRefund.findFirst({ where: { orderId, status: 'PROCESSING' }, orderBy: { createdAt: 'desc' }, select: { id: true } })
      if (pending) return { state: 'PENDING' as const, refundId: pending.id, order }
      throw new TicketingError(TICKETING_ERROR_CODES.REFUND_NOT_AVAILABLE, 'La devolución requiere revisión operativa.', 409)
    }
    if (order.status !== 'PAID') throw new TicketingError(TICKETING_ERROR_CODES.REFUND_NOT_AVAILABLE, 'La orden no está disponible para devolución.', 409)
    if (order.tickets.some((ticket) => ticket.status === 'CHECKED_IN')) throw new TicketingError(TICKETING_ERROR_CODES.REFUND_NOT_AVAILABLE, 'No se puede devolver una entrada ya utilizada.', 409)
    const activeRefund = await tx.ticketRefund.findFirst({ where: { orderId, status: { in: ['PROCESSING', 'SUCCEEDED'] } }, orderBy: { createdAt: 'desc' }, select: { id: true, status: true } })
    if (activeRefund) return { state: activeRefund.status === 'SUCCEEDED' ? 'SUCCEEDED' as const : 'PENDING' as const, refundId: activeRefund.id, order }
    const refund = await tx.ticketRefund.create({ data: { orderId, processedById: actorId, amountCents: order.totalCents - order.refundedCents, reason: reason.trim().slice(0, 500), provider: order.provider, status: 'PROCESSING' }, select: { id: true } })
    await tx.ticketOrder.update({ where: { id: orderId }, data: { status: 'REFUND_PENDING' } })
    return { state: 'NEW' as const, refundId: refund.id, order }
  })

  if (prepared.state === 'PENDING') return { refundId: prepared.refundId, status: 'PROCESSING', pending: true }
  if (prepared.state === 'SUCCEEDED') return { refundId: prepared.refundId, status: 'SUCCEEDED', alreadyProcessed: true }

  let providerAttempted = false
  let providerResponseReceived = false
  let providerReversed = false
  try {
    if (prepared.order.totalCents > 0) {
      if (!prepared.order.providerPaymentId || prepared.order.providerPaymentId === 'FREE') throw new TicketingError(TICKETING_ERROR_CODES.REFUND_NOT_AVAILABLE, 'La orden no tiene referencia PayPhone.', 409)
      const credentials = await credentialsForConfig(prepared.order.ticketing)
      providerAttempted = true
      const response = await reversePayphonePayment(credentials, prepared.order.providerPaymentId)
      providerResponseReceived = true
      if (response !== true) throw new TicketingError(TICKETING_ERROR_CODES.PROVIDER_ERROR, 'PayPhone no pudo reversar el pago.', 502)
      providerReversed = true
    } else {
      providerReversed = true
    }
    await prisma.$transaction(async (tx) => {
      await tx.ticketRefund.update({ where: { id: prepared.refundId }, data: { status: 'SUCCEEDED', providerRef: prepared.order.providerPaymentId } })
      await tx.ticketOrder.update({ where: { id: prepared.order.id }, data: { status: 'REFUNDED', refundedCents: prepared.order.totalCents } })
      await tx.ticket.updateMany({ where: { orderId: prepared.order.id, status: { not: 'CHECKED_IN' } }, data: { status: 'VOID' } })
      const items = await tx.ticketOrderItem.findMany({ where: { orderId: prepared.order.id }, select: { ticketTypeId: true, eventSeatId: true, quantity: true } })
      for (const item of items) {
        if (item.eventSeatId) {
          await tx.eventSeat.updateMany({ where: { id: item.eventSeatId, status: 'SOLD' }, data: { status: 'AVAILABLE' } })
        } else {
          const updated = await tx.ticketType.updateMany({ where: { id: item.ticketTypeId, soldCount: { gte: item.quantity } }, data: { soldCount: { decrement: item.quantity } } })
          if (updated.count !== 1) throw new TicketingError(TICKETING_ERROR_CODES.REFUND_NOT_AVAILABLE, 'No se pudo liberar el cupo del boleto.', 409)
        }
      }
      await tx.ticketingLedgerEntry.create({ data: { orderId: prepared.order.id, entryType: 'REFUND', amountCents: -prepared.order.totalCents, currency: prepared.order.currency } })
    })
  } catch (error) {
    const knownProviderFailure = providerAttempted && providerResponseReceived && !providerReversed
    const configurationFailure = !providerAttempted && !(error instanceof TicketingError && error.code === TICKETING_ERROR_CODES.PROVIDER_ERROR)
    if (knownProviderFailure || configurationFailure) {
      await prisma.$transaction(async (tx) => {
        await tx.ticketRefund.update({ where: { id: prepared.refundId }, data: { status: 'FAILED', failureCode: error instanceof TicketingError ? error.code : 'PROVIDER_ERROR' } })
        await tx.ticketOrder.updateMany({ where: { id: prepared.order.id, status: 'REFUND_PENDING' }, data: { status: 'PAID' } })
      }).catch(() => undefined)
    } else {
      // A timeout can happen after PayPhone has reversed the money. Keep the
      // order pending for operational reconciliation instead of claiming that
      // the refund failed or releasing inventory twice.
      await prisma.ticketRefund.update({ where: { id: prepared.refundId }, data: { failureCode: providerReversed ? 'FINALIZATION_RETRY_REQUIRED' : 'PROVIDER_STATE_UNKNOWN' } }).catch(() => undefined)
    }
    throw error
  }
  return { refundId: prepared.refundId, status: 'SUCCEEDED' }
}

export async function processTicketingOutbox(outboxId: string) {
  const staleProcessingAt = new Date(Date.now() - 10 * 60_000)
  const claimed = await prisma.ticketingOutbox.updateMany({ where: { id: outboxId, attempts: { lt: 5 }, OR: [{ status: { in: ['PENDING', 'FAILED'] } }, { status: 'PROCESSING', updatedAt: { lt: staleProcessingAt } }] }, data: { status: 'PROCESSING', attempts: { increment: 1 } } })
  if (claimed.count !== 1) return { processed: false, reason: 'already-claimed-or-complete' }
  try {
    const row = await prisma.ticketingOutbox.findUniqueOrThrow({ where: { id: outboxId }, select: { id: true, kind: true, orderId: true } })
    if (row.kind === 'SEND_TICKETS' && row.orderId) {
      const order = await prisma.ticketOrder.findUniqueOrThrow({ where: { id: row.orderId }, include: { event: { select: { title: true, slug: true, startDate: true, location: true, user: { select: { name: true, email: true } }, venue: { select: { name: true, email: true } } } }, tickets: { include: { ticketType: { select: { name: true } }, event: { select: { slug: true } } } } } })
      const tickets = await prisma.ticket.findMany({ where: { orderId: order.id }, select: { id: true, code: true, seatLabel: true, status: true, issuedAt: true, qrTokenCiphertext: true, qrTokenIv: true, qrTokenAuthTag: true, event: { select: { slug: true } }, ticketType: { select: { name: true, kind: true } } } })
      const emailTickets = tickets.filter((ticket) => ticket.status !== 'VOID').map((ticket) => ({ code: ticket.code, name: ticket.ticketType.name, seatLabel: ticket.seatLabel, qrData: `${appUrl()}/tickets/scan?token=${encodeURIComponent(decryptSecret({ ciphertext: ticket.qrTokenCiphertext, iv: ticket.qrTokenIv, authTag: ticket.qrTokenAuthTag }))}` }))
      const buyerEmail = normalizedEmail(order.buyerEmail)
      const buyerDelivery = blockedTicketingRecipients.has(buyerEmail)
        ? { success: true }
        : await sendTicketOrderEmail({ to: order.buyerEmail, buyerName: order.buyerName, eventTitle: order.event.title, eventSlug: order.event.slug, startDate: order.event.startDate, location: order.event.location, tickets: emailTickets, clientTransactionId: order.clientTransactionId })
      if (!buyerDelivery.success) throw new Error('No se pudo entregar el correo de entradas al comprador.')

      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true, name: true } })
      const recipients = new Map<string, string>()
      const configuredAdminEmails = (process.env.TICKETING_ADMIN_EMAILS ?? '')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean)
        .map((email) => ({ email, name: 'equipo de Vive Loja' }))
      for (const recipient of [...configuredAdminEmails, order.event.user, order.event.venue, ...admins]) {
        if (!recipient?.email) continue
        const email = normalizedEmail(recipient.email)
        if (email !== buyerEmail && !blockedTicketingRecipients.has(email)) recipients.set(email, recipient.name ?? 'equipo de Vive Loja')
      }
      const failedAdminRecipients: string[] = []
      for (const [recipientEmail, recipientName] of recipients) {
        const adminDelivery = await sendTicketOrderAdminEmail({ to: recipientEmail, recipientName, buyerName: order.buyerName, buyerEmail: order.buyerEmail, buyerPhone: order.buyerPhone, totalCents: order.totalCents, eventTitle: order.event.title, eventSlug: order.event.slug, startDate: order.event.startDate, location: order.event.location, tickets: emailTickets, clientTransactionId: order.clientTransactionId })
        if (!adminDelivery.success) failedAdminRecipients.push(recipientEmail)
      }
      if (failedAdminRecipients.length) console.warn(`No se pudo entregar la notificación de venta a ${failedAdminRecipients.join(', ')}.`)
    }
    await prisma.ticketingOutbox.update({ where: { id: outboxId }, data: { status: 'COMPLETED', processedAt: new Date(), lastError: null } })
    return { processed: true }
  } catch (error) {
    await prisma.ticketingOutbox.update({ where: { id: outboxId }, data: { status: 'FAILED', lastError: error instanceof Error ? error.message.slice(0, 500) : 'Unknown error', availableAt: new Date(Date.now() + 60_000) } }).catch(() => undefined)
    throw error
  }
}
