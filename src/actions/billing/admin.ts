'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { ensureInitialCatalog, latestPublishedVersion } from '@/lib/billing/plans'
import { invalidateVenueCache } from '@/lib/cache-invalidation'
import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/action-response'

const accountPlanSchema = z.object({
  accountId: z.string().min(1),
  planSlug: z.enum(['free', 'plus', 'pro', 'enterprise']),
  cycle: z.enum(['MONTHLY', 'ANNUAL']),
  reason: z.string().trim().min(3).max(500),
})

const overrideSchema = z.object({
  venueId: z.string().min(1),
  planSlug: z.enum(['free', 'plus', 'pro', 'enterprise']),
  endsAt: z.coerce.date().optional().nullable(),
  reason: z.string().trim().min(3).max(500),
})

const versionSchema = z.object({
  planSlug: z.enum(['free', 'plus', 'pro', 'enterprise']),
  monthlyPrice: z.number().min(0),
  annualPrice: z.number().min(0),
  maxLocations: z.number().int().min(0).nullable(),
  maxMembers: z.number().int().min(0).nullable(),
  maxMediaPerVenue: z.number().int().min(0).nullable(),
  googlePhotoEnabled: z.boolean(),
  menuEnabled: z.boolean(),
  servicesEnabled: z.boolean(),
  monthlyEventsPerVenue: z.number().int().min(0).nullable(),
  maxActivePromotionsPerVenue: z.number().int().min(0).nullable(),
  analyticsRetentionDays: z.number().int().min(0).nullable(),
  whatsappEnabled: z.boolean(),
  messagingEnabled: z.boolean(),
  reservationsEnabled: z.boolean(),
  priorityModeration: z.boolean(),
  includedBoostCredits: z.number().int().min(0),
  eventTicketingEnabled: z.boolean().default(false),
  seatMapsEnabled: z.boolean().default(false),
  reason: z.string().trim().min(3).max(500),
})

const planShellSchema = z.object({
  planSlug: z.enum(['free', 'plus', 'pro', 'enterprise']),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).nullable(),
  displayOrder: z.number().int().min(0).max(100),
  isPublished: z.boolean(),
  isArchived: z.boolean(),
  reason: z.string().trim().min(3).max(500),
})

const addonSchema = z.object({
  slug: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).nullable(),
  price: z.number().min(0),
  durationDays: z.number().int().positive().nullable(),
  requiresDelivery: z.boolean(),
  displayOrder: z.number().int().min(0).max(100),
  isPublished: z.boolean(),
  isArchived: z.boolean(),
  reason: z.string().trim().min(3).max(500),
})

async function requireBillingAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') return null
  return session.user.id
}

function period(cycle: 'MONTHLY' | 'ANNUAL') {
  const startsAt = new Date()
  const endsAt = new Date(startsAt)
  endsAt.setUTCDate(endsAt.getUTCDate() + (cycle === 'ANNUAL' ? 365 : 30))
  return { startsAt, endsAt }
}

export async function adminSetAccountPlanAction(input: unknown): Promise<ActionResponse<{ accountId: string }>> {
  const actorId = await requireBillingAdmin()
  if (!actorId) return { success: false, error: 'Solo administradores pueden cambiar planes.' }
  const parsed = accountPlanSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  await ensureInitialCatalog()
  const version = await latestPublishedVersion(parsed.data.planSlug)
  if (!version) return { success: false, error: 'El plan no está disponible.' }
  const account = await prisma.businessAccount.findUnique({ where: { id: parsed.data.accountId }, select: { id: true } })
  if (!account) return { success: false, error: 'Cuenta empresarial no encontrada.' }
  const { startsAt, endsAt } = period(parsed.data.cycle)
  await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({ where: { accountId: account.id, status: 'ACTIVE' }, data: { status: 'CANCELLED' } })
    await tx.subscription.create({ data: { accountId: account.id, planVersionId: version.id, status: 'ACTIVE', cycle: parsed.data.cycle, startsAt, endsAt, referencePrice: parsed.data.cycle === 'ANNUAL' ? version.annualPrice : version.monthlyPrice, mode: 'SIMULATED', source: 'ADMIN' } })
    await tx.billingAuditLog.create({ data: { actorId, accountId: account.id, action: 'ACCOUNT_PLAN_CHANGED', reason: parsed.data.reason, metadata: { planSlug: parsed.data.planSlug, cycle: parsed.data.cycle } } })
  })
  revalidatePath('/admin/monetizacion')
  revalidatePath('/dashboard')
  revalidatePath('/locales')
  await invalidateVenueCache()
  return { success: true, data: { accountId: account.id } }
}

export async function adminSetVenueOverrideAction(input: unknown): Promise<ActionResponse<{ venueId: string }>> {
  const actorId = await requireBillingAdmin()
  if (!actorId) return { success: false, error: 'Solo administradores pueden asignar overrides.' }
  const parsed = overrideSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  await ensureInitialCatalog()
  const version = await latestPublishedVersion(parsed.data.planSlug)
  if (!version) return { success: false, error: 'El plan no está disponible.' }
  const venue = await prisma.venue.findUnique({ where: { id: parsed.data.venueId }, select: { id: true, slug: true, businessAccountId: true } })
  if (!venue) return { success: false, error: 'Local no encontrado.' }
  await prisma.$transaction(async (tx) => {
    await tx.venuePlanOverride.updateMany({ where: { venueId: venue.id, status: 'ACTIVE' }, data: { status: 'REVOKED', revokedAt: new Date() } })
    await tx.venuePlanOverride.create({ data: { venueId: venue.id, planVersionId: version.id, createdById: actorId, reason: parsed.data.reason, endsAt: parsed.data.endsAt ?? null, status: 'ACTIVE' } })
    await tx.billingAuditLog.create({ data: { actorId, accountId: venue.businessAccountId, venueId: venue.id, action: 'VENUE_PLAN_OVERRIDE_CREATED', reason: parsed.data.reason, metadata: { planSlug: parsed.data.planSlug, endsAt: parsed.data.endsAt?.toISOString() ?? null } } })
  })
  revalidatePath(`/locales/${venue.slug}`)
  revalidatePath('/admin/monetizacion')
  await invalidateVenueCache(venue.id)
  return { success: true, data: { venueId: venue.id } }
}

export async function adminRevokeVenueOverrideAction(venueId: string, reason: string): Promise<ActionResponse<{ venueId: string }>> {
  const actorId = await requireBillingAdmin()
  if (!actorId) return { success: false, error: 'Solo administradores pueden revocar overrides.' }
  const cleanReason = reason.trim()
  if (cleanReason.length < 3) return { success: false, error: 'El motivo es obligatorio.' }
  const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { id: true, slug: true, businessAccountId: true } })
  if (!venue) return { success: false, error: 'Local no encontrado.' }
  await prisma.$transaction(async (tx) => {
    await tx.venuePlanOverride.updateMany({ where: { venueId, status: 'ACTIVE' }, data: { status: 'REVOKED', revokedAt: new Date(), revokedById: actorId } })
    await tx.billingAuditLog.create({ data: { actorId, accountId: venue.businessAccountId, venueId, action: 'VENUE_PLAN_OVERRIDE_REVOKED', reason: cleanReason } })
  })
  revalidatePath(`/locales/${venue.slug}`)
  revalidatePath('/admin/monetizacion')
  await invalidateVenueCache(venue.id)
  return { success: true, data: { venueId } }
}

export async function adminUpdateBillingSettingAction(input: { simulationEnabled?: boolean; googlePhotoEnabled?: boolean }): Promise<ActionResponse<{ updated: true }>> {
  const actorId = await requireBillingAdmin()
  if (!actorId) return { success: false, error: 'Solo administradores pueden cambiar esta configuración.' }
  await prisma.billingSetting.upsert({ where: { id: 'global' }, update: { ...input, updatedById: actorId }, create: { id: 'global', simulationEnabled: input.simulationEnabled ?? true, googlePhotoEnabled: input.googlePhotoEnabled ?? true, updatedById: actorId } })
  await prisma.billingAuditLog.create({ data: { actorId, action: 'BILLING_SETTING_CHANGED', metadata: input } })
  revalidatePath('/admin/monetizacion')
  return { success: true, data: { updated: true } }
}

export async function adminUpdatePlanShellAction(input: unknown): Promise<ActionResponse<{ planSlug: string }>> {
  const actorId = await requireBillingAdmin()
  if (!actorId) return { success: false, error: 'Solo administradores pueden editar planes.' }
  const parsed = planShellSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  const { planSlug, reason, ...data } = parsed.data
  const plan = await prisma.plan.update({ where: { slug: planSlug }, data, select: { id: true, slug: true } }).catch(() => null)
  if (!plan) return { success: false, error: 'Plan no encontrado.' }
  await prisma.billingAuditLog.create({ data: { actorId, action: 'PLAN_CATALOG_UPDATED', reason, metadata: { planSlug, ...data } } })
  revalidatePath('/planes')
  revalidatePath('/')
  revalidatePath('/admin/monetizacion')
  return { success: true, data: { planSlug } }
}

export async function adminUpdateAddonAction(input: unknown): Promise<ActionResponse<{ slug: string }>> {
  const actorId = await requireBillingAdmin()
  if (!actorId) return { success: false, error: 'Solo administradores pueden editar extras.' }
  const parsed = addonSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  const { slug, reason, ...values } = parsed.data
  const data = { ...values, type: values.requiresDelivery ? 'DELIVERY' : 'DIGITAL' }
  const product = await prisma.addonProduct.upsert({ where: { slug }, update: data, create: { slug, ...data }, select: { slug: true } })
  await prisma.billingAuditLog.create({ data: { actorId, action: 'ADDON_CATALOG_UPDATED', reason, metadata: { slug, ...data } } })
  revalidatePath('/planes')
  revalidatePath('/')
  revalidatePath('/admin/monetizacion')
  return { success: true, data: product }
}

export async function adminUpdateDeliveryStatusAction(purchaseId: string, status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED'): Promise<ActionResponse<{ id: string }>> {
  const actorId = await requireBillingAdmin()
  if (!actorId) return { success: false, error: 'Solo administradores pueden actualizar entregas.' }
  const purchase = await prisma.addonPurchase.update({ where: { id: purchaseId }, data: { deliveryStatus: status }, select: { id: true, order: { select: { accountId: true, venueId: true } } } }).catch(() => null)
  if (!purchase) return { success: false, error: 'Entrega no encontrada.' }
  await prisma.billingAuditLog.create({ data: { actorId, accountId: purchase.order.accountId, venueId: purchase.order.venueId, action: 'ADDON_DELIVERY_STATUS_CHANGED', reason: `Estado ${status}`, metadata: { purchaseId, status } } })
  revalidatePath('/admin/monetizacion')
  return { success: true, data: { id: purchase.id } }
}

/** Publishes a new immutable version; historical versions stay queryable. */
export async function adminPublishPlanVersionAction(input: unknown): Promise<ActionResponse<{ planSlug: string; version: number }>> {
  const actorId = await requireBillingAdmin()
  if (!actorId) return { success: false, error: 'Solo administradores pueden publicar planes.' }
  const parsed = versionSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  await ensureInitialCatalog()
  const plan = await prisma.plan.findUnique({ where: { slug: parsed.data.planSlug }, select: { id: true, slug: true } })
  if (!plan) return { success: false, error: 'Plan no encontrado.' }
  const current = await prisma.planVersion.findFirst({ where: { planId: plan.id }, orderBy: { version: 'desc' }, select: { version: true } })
  const created = await prisma.$transaction(async (tx) => {
    const version = await tx.planVersion.create({
      data: {
        planId: plan.id,
        version: (current?.version ?? 0) + 1,
        monthlyPrice: parsed.data.monthlyPrice,
        annualPrice: parsed.data.annualPrice,
        maxLocations: parsed.data.maxLocations,
        maxMembers: parsed.data.maxMembers,
        maxMediaPerVenue: parsed.data.maxMediaPerVenue,
        googlePhotoEnabled: parsed.data.googlePhotoEnabled,
        menuEnabled: parsed.data.menuEnabled,
        servicesEnabled: parsed.data.servicesEnabled,
        monthlyEventsPerVenue: parsed.data.monthlyEventsPerVenue,
        maxActivePromotionsPerVenue: parsed.data.maxActivePromotionsPerVenue,
        analyticsRetentionDays: parsed.data.analyticsRetentionDays,
        whatsappEnabled: parsed.data.whatsappEnabled,
        messagingEnabled: parsed.data.messagingEnabled,
        reservationsEnabled: parsed.data.reservationsEnabled,
        priorityModeration: parsed.data.priorityModeration,
        includedBoostCredits: parsed.data.includedBoostCredits,
        eventTicketingEnabled: parsed.data.eventTicketingEnabled,
        seatMapsEnabled: parsed.data.seatMapsEnabled,
        isPublished: true,
        publishedAt: new Date(),
        createdById: actorId,
      },
      select: { version: true },
    })
    await tx.plan.update({ where: { id: plan.id }, data: { isPublished: true, isArchived: false } })
    await tx.billingAuditLog.create({ data: { actorId, action: 'PLAN_VERSION_PUBLISHED', reason: parsed.data.reason, metadata: { planSlug: plan.slug, version: version.version } } })
    return version
  })
  revalidatePath('/planes')
  revalidatePath('/')
  revalidatePath('/admin/monetizacion')
  await invalidateVenueCache()
  return { success: true, data: { planSlug: plan.slug, version: created.version } }
}
