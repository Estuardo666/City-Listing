import 'server-only'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { latestPublishedVersion, ensureBusinessAccount, getBusinessAccountForUser, getPlanForUser, isBillingSimulationEnabled, canManageVenue, type BillingCycle } from './plans'

export type CheckoutInput = {
  userId: string
  planSlug: string
  cycle: BillingCycle
  idempotencyKey: string
  device?: string | null
}

export type ClaimPlanSelectionInput = {
  userId: string
  claimId: string
  planSlug: string
  cycle: BillingCycle
  idempotencyKey: string
  device?: string | null
}

export type AddonCheckoutInput = {
  userId: string
  addonSlug: string
  idempotencyKey: string
  venueId?: string | null
  eventId?: string | null
  device?: string | null
}

function datesForCycle(cycle: BillingCycle, now = new Date()) {
  const endsAt = new Date(now)
  if (cycle === 'ANNUAL') endsAt.setUTCDate(endsAt.getUTCDate() + 365)
  else endsAt.setUTCDate(endsAt.getUTCDate() + 30)
  return { startsAt: now, endsAt }
}

function priceForCycle(version: { monthlyPrice: number; annualPrice: number }, cycle: BillingCycle) {
  return cycle === 'ANNUAL' ? version.annualPrice : version.monthlyPrice
}

function addonEndDate(durationDays: number | null, now: Date) {
  if (!durationDays) return null
  const endsAt = new Date(now)
  endsAt.setUTCDate(endsAt.getUTCDate() + durationDays)
  return endsAt
}

async function serializableTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) continue
      throw error
    }
  }
  throw new Error('No se pudo completar la operación concurrente.')
}

export function serializeOrder(order: {
  id: string
  status: string
  kind: string
  mode: string
  cycle: string | null
  referenceAmount: number
  chargedAmount: number
  currency: string
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
  planVersion?: { plan: { slug: string; name: string }; version: number } | null
  addonProduct?: { slug: string; name: string } | null
}) {
  return {
    id: order.id,
    status: order.status,
    kind: order.kind,
    mode: order.mode,
    cycle: order.cycle,
    referenceAmount: order.referenceAmount,
    chargedAmount: order.chargedAmount,
    currency: order.currency,
    startsAt: order.startsAt,
    endsAt: order.endsAt,
    createdAt: order.createdAt,
    plan: order.planVersion ? { slug: order.planVersion.plan.slug, name: order.planVersion.plan.name, version: order.planVersion.version } : null,
    addon: order.addonProduct ? { slug: order.addonProduct.slug, name: order.addonProduct.name } : null,
  }
}

/** Simulated provider: no card data is accepted or stored, ever. */
export async function checkoutSubscription(input: CheckoutInput) {
  if (!await isBillingSimulationEnabled()) {
    throw new Error('La activación beta está temporalmente pausada.')
  }
  const version = await latestPublishedVersion(input.planSlug)
  if (!version) throw new Error('El plan seleccionado no está disponible.')
  if (version.plan.slug === 'enterprise') throw new Error('El plan Enterprise se activa por contacto con Vive Loja.')
  const account = await ensureBusinessAccount(input.userId)
  const existing = await prisma.order.findFirst({
    where: { accountId: account.id, idempotencyKey: input.idempotencyKey },
    include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } },
  })
  if (existing) return serializeOrder(existing)

  const { startsAt, endsAt } = datesForCycle(input.cycle)
  const referenceAmount = priceForCycle(version, input.cycle)
  let created
  try {
    created = await serializableTransaction(async (tx) => {
    const race = await tx.order.findFirst({
      where: { accountId: account.id, idempotencyKey: input.idempotencyKey },
      include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } },
    })
    if (race) return race

    // A new beta period starts now; it never accumulates with a previous one.
    await tx.subscription.updateMany({
      where: { accountId: account.id, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    })
    const order = await tx.order.create({
      data: {
        accountId: account.id,
        buyerId: input.userId,
        planVersionId: version.id,
        idempotencyKey: input.idempotencyKey,
        kind: 'SUBSCRIPTION',
        status: 'COMPLETED',
        mode: 'SIMULATED',
        cycle: input.cycle,
        referenceAmount,
        chargedAmount: 0,
        currency: version.currency,
        device: input.device ?? null,
        startsAt,
        endsAt,
      },
      include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } },
    })
    await tx.subscription.create({
      data: {
        accountId: account.id,
        planVersionId: version.id,
        status: 'ACTIVE',
        cycle: input.cycle,
        startsAt,
        endsAt,
        referencePrice: referenceAmount,
        mode: 'SIMULATED',
        source: 'CHECKOUT',
      },
    })
    await tx.billingAuditLog.create({
      data: {
        actorId: input.userId,
        accountId: account.id,
        action: 'SUBSCRIPTION_ACTIVATED',
        reason: 'Checkout beta simulado',
        metadata: { planSlug: version.plan.slug, cycle: input.cycle, referenceAmount, chargedAmount: 0 },
      },
    })
    return order
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicate = await prisma.order.findFirst({
        where: { accountId: account.id, idempotencyKey: input.idempotencyKey },
        include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } },
      })
      if (duplicate) return serializeOrder(duplicate)
    }
    throw error
  }
  return serializeOrder(created)
}

/** Simulated one-off purchase. It never accepts or persists card/payment data. */
export async function checkoutAddon(input: AddonCheckoutInput) {
  if (!await isBillingSimulationEnabled()) {
    throw new Error('La activación beta está temporalmente pausada.')
  }
  const account = await ensureBusinessAccount(input.userId)
  const product = await prisma.addonProduct.findFirst({
    where: { slug: input.addonSlug, isPublished: true, isArchived: false },
  })
  if (!product) throw new Error('El producto seleccionado no está disponible.')

  const isEventBoost = product.slug === 'event-boost-7d'
  if (isEventBoost && !input.eventId) throw new Error('Selecciona el evento que quieres promocionar.')
  if (!isEventBoost && !input.venueId) throw new Error('Selecciona el local asociado a la compra.')

  if (input.venueId) {
    const allowed = await canManageVenue(input.userId, input.venueId)
    if (!allowed) throw new Error('El local no pertenece a tu cuenta.')
  }
  if (input.eventId) {
    const event = await prisma.event.findUnique({ where: { id: input.eventId }, select: { id: true, userId: true, venueId: true } })
    const allowed = !!event && (event.userId === input.userId || (!!event.venueId && await canManageVenue(input.userId, event.venueId)))
    if (!allowed) throw new Error('El evento no pertenece a tu cuenta.')
  }

  const existing = await prisma.order.findFirst({
    where: { accountId: account.id, idempotencyKey: input.idempotencyKey },
    include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } },
  })
  if (existing) return serializeOrder(existing)

  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - 30)
  const recentPurchase = await prisma.order.findFirst({
    where: { accountId: account.id, addonProductId: product.id, kind: 'ADDON', status: 'COMPLETED', createdAt: { gte: cutoff } },
    select: { id: true },
  })
  if (recentPurchase) throw new Error('Este producto ya fue comprado por tu cuenta durante los últimos 30 días.')

  const now = new Date()
  const endsAt = addonEndDate(product.durationDays, now)
  let created
  try {
    created = await serializableTransaction(async (tx) => {
    const race = await tx.order.findFirst({
      where: { accountId: account.id, idempotencyKey: input.idempotencyKey },
      include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } },
    })
    if (race) return race

    const order = await tx.order.create({
      data: {
        accountId: account.id,
        buyerId: input.userId,
        venueId: input.venueId ?? null,
        eventId: input.eventId ?? null,
        addonProductId: product.id,
        idempotencyKey: input.idempotencyKey,
        kind: 'ADDON',
        status: 'COMPLETED',
        mode: 'SIMULATED',
        referenceAmount: product.price,
        chargedAmount: 0,
        currency: product.currency,
        device: input.device ?? null,
        startsAt: now,
        endsAt,
        metadata: { productType: product.type, requiresDelivery: product.requiresDelivery },
      },
      include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } },
    })
    await tx.addonPurchase.create({
      data: {
        orderId: order.id,
        addonProductId: product.id,
        buyerId: input.userId,
        venueId: input.venueId ?? null,
        eventId: input.eventId ?? null,
        deliveryStatus: product.requiresDelivery ? 'PENDING' : 'NOT_REQUIRED',
        startsAt: now,
        endsAt,
      },
    })
    if (product.type === 'DIGITAL' && endsAt && input.venueId) {
      await tx.venue.update({ where: { id: input.venueId }, data: { sponsoredUntil: endsAt } })
    }
    if (product.type === 'DIGITAL' && endsAt && input.eventId) {
      await tx.event.update({ where: { id: input.eventId }, data: { sponsoredUntil: endsAt } })
    }
    await tx.billingAuditLog.create({
      data: {
        actorId: input.userId,
        accountId: account.id,
        venueId: input.venueId ?? null,
        action: 'ADDON_PURCHASED',
        reason: 'Compra beta simulada',
        metadata: { addonSlug: product.slug, referenceAmount: product.price, chargedAmount: 0, activatedUntil: endsAt?.toISOString() ?? null },
      },
    })
    return order
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicate = await prisma.order.findFirst({
        where: { accountId: account.id, idempotencyKey: input.idempotencyKey },
        include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } },
      })
      if (duplicate) return serializeOrder(duplicate)
    }
    throw error
  }
  return serializeOrder(created)
}

export async function selectPlanForClaim(input: ClaimPlanSelectionInput) {
  if (!await isBillingSimulationEnabled()) throw new Error('La activación beta está temporalmente pausada.')
  const claim = await prisma.venueClaim.findUnique({
    where: { id: input.claimId },
    select: { id: true, userId: true, status: true, venueId: true, billingOrder: { select: { id: true } } },
  })
  if (!claim) throw new Error('Reclamo no encontrado.')
  if (claim.userId !== input.userId) throw new Error('No tienes permiso para este reclamo.')
  if (!['PENDING', 'VERIFIED'].includes(claim.status)) throw new Error('Este reclamo ya no admite selección de plan.')
  const version = await latestPublishedVersion(input.planSlug)
  if (!version) throw new Error('El plan seleccionado no está disponible.')
  if (version.plan.slug === 'enterprise') throw new Error('El plan Enterprise se activa por contacto con Vive Loja.')
  const account = await ensureBusinessAccount(input.userId)
  const existing = await prisma.order.findFirst({
    where: { accountId: account.id, idempotencyKey: input.idempotencyKey, claimId: input.claimId },
    include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } },
  })
  if (existing) return serializeOrder(existing)
  const referenceAmount = priceForCycle(version, input.cycle)
  const created = await serializableTransaction(async (tx) => {
    const fresh = await tx.venueClaim.findUnique({ where: { id: claim.id }, select: { id: true, status: true, venueId: true, billingOrder: { select: { id: true } } } })
    if (!fresh || !['PENDING', 'VERIFIED'].includes(fresh.status)) throw new Error('Este reclamo ya no admite selección de plan.')
    const orderData = {
      accountId: account.id,
      buyerId: input.userId,
      venueId: fresh.venueId,
      claimId: fresh.id,
      planVersionId: version.id,
      idempotencyKey: input.idempotencyKey,
      kind: 'SUBSCRIPTION',
      status: 'PENDING',
      mode: 'SIMULATED',
      cycle: input.cycle,
      referenceAmount,
      chargedAmount: 0,
      currency: version.currency,
      device: input.device ?? null,
      startsAt: null,
      endsAt: null,
    }
    const order = fresh.billingOrder
      ? await tx.order.update({
          where: { id: fresh.billingOrder.id },
          data: orderData,
          include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } },
        })
      : await tx.order.create({
          data: orderData,
          include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } },
        })
    await tx.venueClaim.update({ where: { id: fresh.id }, data: { selectedPlanVersionId: version.id, planSelectionStatus: 'PENDING_CLAIM_APPROVAL' } })
    await tx.billingAuditLog.create({
      data: {
        actorId: input.userId,
        accountId: account.id,
        venueId: claim.venueId,
        action: 'CLAIM_PLAN_SELECTED',
        reason: 'Selección de plan pendiente de aprobación',
        metadata: { planSlug: version.plan.slug, cycle: input.cycle, referenceAmount },
      },
    })
    return order
  })
  return serializeOrder(created)
}

/** Applies the pending selection exactly once when an admin approves a claim. */
export async function approveClaimWithBilling(claimId: string, actorId: string) {
  const claim = await prisma.venueClaim.findUnique({
    where: { id: claimId },
    include: {
      venue: { select: { id: true, slug: true } },
      billingOrder: { include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } } } },
    },
  })
  if (!claim) throw new Error('Reclamo no encontrado.')
  const account = await ensureBusinessAccount(claim.userId)
  const result = await serializableTransaction(async (tx) => {
    const fresh = await tx.venueClaim.findUnique({ where: { id: claimId }, include: { billingOrder: true } })
    if (!fresh) throw new Error('Reclamo no encontrado.')
    if (fresh.status === 'APPROVED' && fresh.planSelectionStatus === 'ACTIVATED') return fresh

    const transition = await tx.venueClaim.updateMany({
      where: { id: claimId, status: { in: ['PENDING', 'VERIFIED'] } },
      data: { status: 'APPROVED' },
    })
    if (transition.count === 0) {
      if (fresh.status === 'APPROVED') return fresh
      throw new Error('Este reclamo ya fue procesado.')
    }

    const selectedPlan = fresh.selectedPlanVersionId
      ? await tx.planVersion.findUnique({ where: { id: fresh.selectedPlanVersionId }, include: { plan: { select: { slug: true, name: true } } } })
      : null
    const activeSubscription = await tx.subscription.findFirst({
      where: { accountId: account.id, status: 'ACTIVE', startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
      orderBy: { startsAt: 'desc' },
      include: { planVersion: true },
    })
    const existingVenueCount = await tx.venue.count({ where: { businessAccountId: account.id, id: { not: fresh.venueId } } })
    const currentLimit = activeSubscription?.planVersion.maxLocations ?? 1
    const hasCurrentCapacity = currentLimit === null || existingVenueCount + 1 <= currentLimit
    const isFirstVenue = existingVenueCount === 0
    const selectedLimit = selectedPlan?.maxLocations ?? 0
    const selectedHasCapacity = selectedLimit === null || existingVenueCount + 1 <= selectedLimit
    const shouldActivateSelection = !!selectedPlan && !!fresh.billingOrder && (isFirstVenue || !hasCurrentCapacity)

    if (!hasCurrentCapacity && (!selectedPlan || !selectedHasCapacity)) {
      throw new Error('El plan seleccionado no tiene cupo para añadir este local. Selecciona un plan superior.')
    }

    if (shouldActivateSelection && fresh.billingOrder?.status === 'PENDING') {
      const now = new Date()
      const { startsAt, endsAt } = datesForCycle((fresh.billingOrder.cycle as BillingCycle) || 'MONTHLY', now)
      await tx.subscription.updateMany({ where: { accountId: account.id, status: 'ACTIVE' }, data: { status: 'CANCELLED' } })
      await tx.subscription.create({
        data: {
          accountId: account.id,
          planVersionId: selectedPlan.id,
          status: 'ACTIVE',
          cycle: (fresh.billingOrder.cycle as BillingCycle) || 'MONTHLY',
          startsAt,
          endsAt,
          referencePrice: fresh.billingOrder.referenceAmount,
          mode: 'SIMULATED',
          source: 'CLAIM_APPROVAL',
        },
      })
      await tx.order.update({ where: { id: fresh.billingOrder.id }, data: { status: 'COMPLETED', startsAt, endsAt } })
    } else if (fresh.billingOrder?.status === 'PENDING') {
      await tx.order.update({ where: { id: fresh.billingOrder.id }, data: { status: 'VOIDED' } })
    }
    await tx.venue.update({
      where: { id: fresh.venueId },
      data: { claimed: true, claimedBy: fresh.userId, verified: true, badge: 'VERIFIED', businessAccountId: account.id },
    })
    const updated = await tx.venueClaim.update({
      where: { id: claimId },
      data: { status: 'APPROVED', planSelectionStatus: shouldActivateSelection ? 'ACTIVATED' : selectedPlan ? 'INHERITED_EXISTING' : 'NONE' },
    })
    await tx.billingAuditLog.create({
      data: { actorId, accountId: account.id, venueId: fresh.venueId, action: 'CLAIM_APPROVED', reason: 'Aprobación administrativa', metadata: { claimId, planSlug: selectedPlan?.plan.slug ?? 'free' } },
    })
    return updated
  })
  return result
}

export async function rejectClaimWithBilling(claimId: string, actorId: string) {
  return serializableTransaction(async (tx) => {
    const claim = await tx.venueClaim.findUnique({ where: { id: claimId }, select: { id: true, status: true, venueId: true, billingOrder: { select: { id: true, accountId: true } } } })
    if (!claim) throw new Error('Reclamo no encontrado.')
    const transition = await tx.venueClaim.updateMany({ where: { id: claimId, status: { in: ['PENDING', 'VERIFIED'] } }, data: { status: 'REJECTED', planSelectionStatus: 'VOIDED' } })
    if (transition.count === 0) {
      if (claim.status === 'REJECTED') return tx.venueClaim.findUniqueOrThrow({ where: { id: claimId } })
      throw new Error('Este reclamo ya fue procesado.')
    }
    if (claim.billingOrder) await tx.order.update({ where: { id: claim.billingOrder.id }, data: { status: 'VOIDED' } })
    await tx.billingAuditLog.create({ data: { actorId, accountId: claim.billingOrder?.accountId, venueId: claim.venueId, action: 'CLAIM_REJECTED', reason: 'Rechazo administrativo', metadata: { claimId } } })
    return tx.venueClaim.findUniqueOrThrow({ where: { id: claimId } })
  })
}

export async function getBusinessAccountSnapshot(userId: string) {
  const account = await getBusinessAccountForUser(userId)
  if (!account) return null
  const plan = await getPlanForUser(userId)
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const [members, venues, orders, activeSubscription, consumedBoosts] = await Promise.all([
    prisma.businessMembership.findMany({ where: { accountId: account.id }, orderBy: { createdAt: 'asc' }, select: { id: true, role: true, createdAt: true, user: { select: { id: true, name: true, email: true, role: true } } } }),
    prisma.venue.findMany({ where: { businessAccountId: account.id }, orderBy: { createdAt: 'asc' }, select: { id: true, name: true, slug: true, status: true, _count: { select: { media: true, events: { where: { createdAt: { gte: monthStart } } }, promotions: { where: { status: 'APPROVED', validUntil: { gte: now } } } } } } }),
    prisma.order.findMany({ where: { accountId: account.id }, orderBy: { createdAt: 'desc' }, take: 50, include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } } }),
    prisma.subscription.findFirst({ where: { accountId: account.id, status: 'ACTIVE', startsAt: { lte: now }, endsAt: { gt: now } }, orderBy: { startsAt: 'desc' }, select: { id: true, cycle: true, startsAt: true, endsAt: true, referencePrice: true, mode: true, planVersion: { include: { plan: { select: { slug: true, name: true } } } } } }),
    prisma.addonPurchase.count({ where: { order: { accountId: account.id, status: 'COMPLETED' }, addonProduct: { slug: { in: ['boost-7d', 'boost-30d', 'event-boost-7d'] } }, createdAt: { gte: monthStart } } }),
  ])
  return {
    account: { id: account.id, name: account.name, role: members.find((member) => member.user.id === userId)?.role ?? 'EDITOR' },
    plan,
    subscription: activeSubscription,
    usage: {
      locations: { used: venues.length, limit: plan.capabilities.maxLocations },
      members: { used: members.length, limit: plan.capabilities.maxMembers },
      boostCredits: { used: consumedBoosts, limit: plan.capabilities.includedBoostCredits },
      venues: venues.map((venue) => ({ id: venue.id, name: venue.name, slug: venue.slug, status: venue.status, media: { used: venue._count.media, limit: plan.capabilities.maxMediaPerVenue }, events: { used: venue._count.events, limit: plan.capabilities.monthlyEventsPerVenue }, promotions: { used: venue._count.promotions, limit: plan.capabilities.maxActivePromotionsPerVenue } })),
    },
    members,
    venues,
    orders: orders.map(serializeOrder),
  }
}
