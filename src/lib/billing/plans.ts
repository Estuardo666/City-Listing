import 'server-only'

import { Prisma, type PlanVersion } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const PLAN_SLUGS = ['free', 'plus', 'pro', 'red'] as const
export type PlanSlug = (typeof PLAN_SLUGS)[number]
export type BillingCycle = 'MONTHLY' | 'ANNUAL'

export const BILLING_ERROR_CODES = {
  PLAN_REQUIRED: 'PLAN_REQUIRED',
  LOCATION_LIMIT_REACHED: 'LOCATION_LIMIT_REACHED',
  MEDIA_LIMIT_REACHED: 'MEDIA_LIMIT_REACHED',
  EVENT_LIMIT_REACHED: 'EVENT_LIMIT_REACHED',
  PROMOTION_LIMIT_REACHED: 'PROMOTION_LIMIT_REACHED',
  MEMBER_LIMIT_REACHED: 'MEMBER_LIMIT_REACHED',
  FEATURE_NOT_INCLUDED: 'FEATURE_NOT_INCLUDED',
} as const

export type BillingErrorCode = (typeof BILLING_ERROR_CODES)[keyof typeof BILLING_ERROR_CODES]

export type PlanCapabilities = {
  maxLocations: number | null
  maxMembers: number | null
  maxMediaPerVenue: number | null
  googlePhotoEnabled: boolean
  menuEnabled: boolean
  servicesEnabled: boolean
  monthlyEventsPerVenue: number | null
  maxActivePromotionsPerVenue: number | null
  analyticsRetentionDays: number | null
  whatsappEnabled: boolean
  messagingEnabled: boolean
  reservationsEnabled: boolean
  priorityModeration: boolean
  includedBoostCredits: number
}

export type EffectivePlan = {
  slug: string
  name: string
  versionId: string
  version: number
  source: 'INHERITED' | 'ADMIN_OVERRIDE'
  capabilities: PlanCapabilities
  monthlyPrice: number
  annualPrice: number
  currency: string
  entitlementsVersion: string
  entitlementStartedAt: Date | null
}

export class BillingEntitlementError extends Error {
  readonly code: BillingErrorCode
  readonly context: {
    plan: string
    usage: number
    limit: number | null
    recommendedPlan: string | null
  }

  constructor(
    code: BillingErrorCode,
    message: string,
    context: BillingEntitlementError['context'],
  ) {
    super(message)
    this.name = 'BillingEntitlementError'
    this.code = code
    this.context = context
  }
}

type Db = PrismaClientLike | Prisma.TransactionClient
type PrismaClientLike = typeof prisma
type PlanVersionWithPlan = PlanVersion & { plan: { slug: string; name: string } }

const FREE_CAPABILITIES: PlanCapabilities = {
  maxLocations: 1,
  maxMembers: 1,
  maxMediaPerVenue: 0,
  googlePhotoEnabled: true,
  menuEnabled: false,
  servicesEnabled: true,
  monthlyEventsPerVenue: 0,
  maxActivePromotionsPerVenue: 0,
  analyticsRetentionDays: null,
  whatsappEnabled: false,
  messagingEnabled: false,
  reservationsEnabled: false,
  priorityModeration: false,
  includedBoostCredits: 0,
}

function capabilitiesOf(version: PlanVersion): PlanCapabilities {
  return {
    maxLocations: version.maxLocations,
    maxMembers: version.maxMembers,
    maxMediaPerVenue: version.maxMediaPerVenue,
    googlePhotoEnabled: version.googlePhotoEnabled,
    menuEnabled: version.menuEnabled,
    servicesEnabled: version.servicesEnabled,
    monthlyEventsPerVenue: version.monthlyEventsPerVenue,
    maxActivePromotionsPerVenue: version.maxActivePromotionsPerVenue,
    analyticsRetentionDays: version.analyticsRetentionDays,
    whatsappEnabled: version.whatsappEnabled,
    messagingEnabled: version.messagingEnabled,
    reservationsEnabled: version.reservationsEnabled,
    priorityModeration: version.priorityModeration,
    includedBoostCredits: version.includedBoostCredits,
  }
}

function freeEffectivePlan(): EffectivePlan {
  return {
    slug: 'free',
    name: 'Gratis',
    versionId: 'free-default',
    version: 1,
    source: 'INHERITED',
    capabilities: FREE_CAPABILITIES,
    monthlyPrice: 0,
    annualPrice: 0,
    currency: 'USD',
    entitlementsVersion: 'free-v1',
    entitlementStartedAt: null,
  }
}

function toEffectivePlan(version: PlanVersionWithPlan, source: EffectivePlan['source'], entitlementStartedAt: Date | null = null): EffectivePlan {
  return {
    slug: version.plan.slug,
    name: version.plan.name,
    versionId: version.id,
    version: version.version,
    source,
    capabilities: capabilitiesOf(version),
    monthlyPrice: version.monthlyPrice,
    annualPrice: version.annualPrice,
    currency: version.currency,
    entitlementsVersion: `${version.plan.slug}-v${version.version}`,
    entitlementStartedAt,
  }
}

function expandedCapabilities(current: PlanCapabilities, latest: PlanCapabilities): PlanCapabilities {
  const expandedLimit = (active: number | null, candidate: number | null) => {
    if (active === null || candidate === null) return null
    return Math.max(active, candidate)
  }
  return {
    maxLocations: expandedLimit(current.maxLocations, latest.maxLocations),
    maxMembers: expandedLimit(current.maxMembers, latest.maxMembers),
    maxMediaPerVenue: expandedLimit(current.maxMediaPerVenue, latest.maxMediaPerVenue),
    googlePhotoEnabled: current.googlePhotoEnabled || latest.googlePhotoEnabled,
    menuEnabled: current.menuEnabled || latest.menuEnabled,
    servicesEnabled: current.servicesEnabled || latest.servicesEnabled,
    monthlyEventsPerVenue: expandedLimit(current.monthlyEventsPerVenue, latest.monthlyEventsPerVenue),
    maxActivePromotionsPerVenue: expandedLimit(current.maxActivePromotionsPerVenue, latest.maxActivePromotionsPerVenue),
    analyticsRetentionDays: expandedLimit(current.analyticsRetentionDays, latest.analyticsRetentionDays),
    whatsappEnabled: current.whatsappEnabled || latest.whatsappEnabled,
    messagingEnabled: current.messagingEnabled || latest.messagingEnabled,
    reservationsEnabled: current.reservationsEnabled || latest.reservationsEnabled,
    priorityModeration: current.priorityModeration || latest.priorityModeration,
    includedBoostCredits: Math.max(current.includedBoostCredits, latest.includedBoostCredits),
  }
}

async function effectiveVersion(version: PlanVersionWithPlan, source: EffectivePlan['source'], entitlementStartedAt: Date | null) {
  const effective = toEffectivePlan(version, source, entitlementStartedAt)
  const latest = await latestPublishedVersion(version.plan.slug)
  if (!latest || latest.version <= version.version) return effective
  return {
    ...effective,
    capabilities: expandedCapabilities(effective.capabilities, capabilitiesOf(latest)),
    entitlementsVersion: `${effective.entitlementsVersion}+benefits-v${latest.version}`,
  }
}

async function ensureFreePlan(db: Db): Promise<PlanVersionWithPlan> {
  const existing = await db.planVersion.findFirst({
    where: { plan: { slug: 'free' }, version: 1 },
    include: { plan: { select: { slug: true, name: true } } },
  })
  if (existing) return existing

  const plan = await db.plan.upsert({
    where: { slug: 'free' },
    update: {},
    create: {
      slug: 'free',
      name: 'Gratis',
      description: 'Presencia esencial para empezar.',
      isPublished: true,
      displayOrder: 0,
    },
  })
  return db.planVersion.create({
    data: {
      planId: plan.id,
      version: 1,
      ...FREE_CAPABILITIES,
      isPublished: true,
      publishedAt: new Date(),
    },
    include: { plan: { select: { slug: true, name: true } } },
  })
}

const INITIAL_CATALOG = [
  { slug: 'free', name: 'Gratis', description: 'Presencia esencial para empezar.', order: 0, monthlyPrice: 0, annualPrice: 0, maxLocations: 1, maxMembers: 1, maxMediaPerVenue: 0, menuEnabled: false, monthlyEventsPerVenue: 0, maxActivePromotionsPerVenue: 0, analyticsRetentionDays: null, whatsappEnabled: false, messagingEnabled: false, reservationsEnabled: false, priorityModeration: false, includedBoostCredits: 0 },
  { slug: 'plus', name: 'Plus', description: 'Más presencia y actividad para tu negocio.', order: 1, monthlyPrice: 9.90, annualPrice: 99, maxLocations: 2, maxMembers: 2, maxMediaPerVenue: 15, menuEnabled: true, monthlyEventsPerVenue: 4, maxActivePromotionsPerVenue: 2, analyticsRetentionDays: 90, whatsappEnabled: true, messagingEnabled: true, reservationsEnabled: false, priorityModeration: true, includedBoostCredits: 1 },
  { slug: 'pro', name: 'Pro', description: 'Herramientas completas para crecer y convertir.', order: 2, monthlyPrice: 24.90, annualPrice: 249, maxLocations: 4, maxMembers: 5, maxMediaPerVenue: 30, menuEnabled: true, monthlyEventsPerVenue: null, maxActivePromotionsPerVenue: 10, analyticsRetentionDays: null, whatsappEnabled: true, messagingEnabled: true, reservationsEnabled: true, priorityModeration: true, includedBoostCredits: 4 },
  { slug: 'red', name: 'Red', description: 'Una solución configurable para varias ubicaciones.', order: 3, monthlyPrice: 99, annualPrice: 0, maxLocations: null, maxMembers: null, maxMediaPerVenue: null, menuEnabled: true, monthlyEventsPerVenue: null, maxActivePromotionsPerVenue: null, analyticsRetentionDays: null, whatsappEnabled: true, messagingEnabled: true, reservationsEnabled: true, priorityModeration: true, includedBoostCredits: 0 },
] as const

export async function ensureInitialCatalog() {
  await prisma.$transaction(async (tx) => {
    for (const item of INITIAL_CATALOG) {
      const plan = await tx.plan.upsert({
        where: { slug: item.slug },
        update: {},
        create: { slug: item.slug, name: item.name, description: item.description, isPublished: true, displayOrder: item.order },
      })
      const versionData = {
        planId: plan.id,
        version: 1,
        monthlyPrice: item.monthlyPrice,
        annualPrice: item.annualPrice,
        maxLocations: item.maxLocations,
        maxMembers: item.maxMembers,
        maxMediaPerVenue: item.maxMediaPerVenue,
        googlePhotoEnabled: true,
        menuEnabled: item.menuEnabled,
        servicesEnabled: true,
        monthlyEventsPerVenue: item.monthlyEventsPerVenue,
        maxActivePromotionsPerVenue: item.maxActivePromotionsPerVenue,
        analyticsRetentionDays: item.analyticsRetentionDays,
        whatsappEnabled: item.whatsappEnabled,
        messagingEnabled: item.messagingEnabled,
        reservationsEnabled: item.reservationsEnabled,
        priorityModeration: item.priorityModeration,
        includedBoostCredits: item.includedBoostCredits,
        isPublished: true,
        publishedAt: new Date(),
      }
      await tx.planVersion.upsert({
        where: { id: `plan_${item.slug}_v1` },
        // Existing versions are immutable; only the plan shell may be kept
        // published by the bootstrap.
        update: {},
        create: { id: `plan_${item.slug}_v1`, ...versionData },
      })
    }
    const addons = [
      ['boost-7d', 'Local destacado · 7 días', 2.99, 7, false, 0],
      ['boost-30d', 'Local destacado · 30 días', 9.99, 30, false, 1],
      ['event-boost-7d', 'Evento promocionado · 7 días', 3.99, 7, false, 2],
      ['professional-setup', 'Configuración profesional', 20, null, true, 3],
      ['qr-kit', 'Kit QR', 19, null, true, 4],
    ] as const
    for (const [slug, name, price, durationDays, requiresDelivery, displayOrder] of addons) {
      await tx.addonProduct.upsert({
        where: { slug },
        update: {},
        create: { slug, name, price, durationDays, requiresDelivery, isPublished: true, displayOrder, type: requiresDelivery ? 'DELIVERY' : 'DIGITAL' },
      })
    }
    await tx.billingSetting.upsert({
      where: { id: 'global' },
      update: {},
      create: { id: 'global', simulationEnabled: true, googlePhotoEnabled: true },
    })
  })
}

export async function isBillingSimulationEnabled() {
  if (process.env.BILLING_SIMULATION_ENABLED === 'false') return false
  try {
    const setting = await prisma.billingSetting.findUnique({ where: { id: 'global' }, select: { simulationEnabled: true } })
    return setting?.simulationEnabled ?? true
  } catch {
    // The setting is absent only while an older deployment is being migrated.
    return true
  }
}

/** Ensures legacy users have exactly one owner account and a Free plan. */
export async function ensureBusinessAccount(userId: string) {
  const free = await ensureFreePlan(prisma)
  return prisma.$transaction(async (tx) => {
    const account = await tx.businessAccount.upsert({
      where: { ownerId: userId },
      update: {},
      create: { ownerId: userId },
      select: { id: true },
    })

    await tx.businessMembership.upsert({
      where: { accountId_userId: { accountId: account.id, userId } },
      update: { role: 'OWNER' },
      create: { accountId: account.id, userId, role: 'OWNER' },
    })
    await tx.venue.updateMany({
      where: { userId, businessAccountId: null },
      data: { businessAccountId: account.id },
    })
    const now = new Date()
    await tx.subscription.updateMany({
      where: { accountId: account.id, status: 'ACTIVE', endsAt: { lte: now } },
      data: { status: 'EXPIRED' },
    })
    const active = await tx.subscription.findFirst({
      where: { accountId: account.id, status: 'ACTIVE', endsAt: { gt: now } },
      select: { id: true },
    })
    if (!active) {
      await tx.subscription.create({
        data: {
          accountId: account.id,
          planVersionId: free.id,
          cycle: 'CUSTOM',
          startsAt: now,
          endsAt: new Date('2099-12-31T23:59:59.999Z'),
          referencePrice: 0,
          mode: 'SIMULATED',
          source: 'MIGRATION',
        },
      })
    }
    return account
  })
}

export async function getBusinessAccountForUser(userId: string) {
  let membership = await prisma.businessMembership.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: { account: true },
  })
  if (!membership) {
    const ownsVenue = await prisma.venue.count({ where: { userId } })
    if (ownsVenue > 0) {
      const account = await ensureBusinessAccount(userId)
      membership = await prisma.businessMembership.findUniqueOrThrow({
        where: { accountId_userId: { accountId: account.id, userId } },
        include: { account: true },
      })
    }
  }
  return membership?.account ?? null
}

export async function latestPublishedVersion(slug: string, db: Db = prisma): Promise<PlanVersionWithPlan | null> {
  const version = await db.planVersion.findFirst({
    where: {
      plan: { slug, isPublished: true, isArchived: false },
      isPublished: true,
    },
    orderBy: { version: 'desc' },
    include: { plan: { select: { slug: true, name: true } } },
  })
  if (version || db !== prisma || !PLAN_SLUGS.includes(slug as PlanSlug)) return version
  await ensureInitialCatalog()
  return db.planVersion.findFirst({
    where: { plan: { slug, isPublished: true, isArchived: false }, isPublished: true },
    orderBy: { version: 'desc' },
    include: { plan: { select: { slug: true, name: true } } },
  })
}

export async function getPublishedCatalog() {
  let [plans, addons, setting] = await Promise.all([
    prisma.plan.findMany({
      where: { isPublished: true, isArchived: false },
      orderBy: { displayOrder: 'asc' },
      include: { versions: { where: { isPublished: true }, orderBy: { version: 'desc' }, take: 1 } },
    }),
    prisma.addonProduct.findMany({
      where: { isPublished: true, isArchived: false },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.billingSetting.findUnique({ where: { id: 'global' }, select: { simulationEnabled: true, googlePhotoEnabled: true } }).catch(() => null),
  ])
  if (plans.length === 0) {
    await ensureInitialCatalog()
    ;[plans, addons, setting] = await Promise.all([
      prisma.plan.findMany({ where: { isPublished: true, isArchived: false }, orderBy: { displayOrder: 'asc' }, include: { versions: { where: { isPublished: true }, orderBy: { version: 'desc' }, take: 1 } } }),
      prisma.addonProduct.findMany({ where: { isPublished: true, isArchived: false }, orderBy: { displayOrder: 'asc' } }),
      prisma.billingSetting.findUnique({ where: { id: 'global' }, select: { simulationEnabled: true, googlePhotoEnabled: true } }),
    ])
  }
  return {
    plans: plans.map((plan) => {
      const version = plan.versions[0]
      return {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        ...(version ? { version: version.version, versionId: version.id, monthlyPrice: version.monthlyPrice, annualPrice: version.annualPrice, currency: version.currency, capabilities: capabilitiesOf(version) } : {}),
      }
    }),
    addons,
    simulation: {
      enabled: process.env.BILLING_SIMULATION_ENABLED !== 'false' && (setting?.simulationEnabled ?? true),
      googlePhotoEnabled: setting?.googlePhotoEnabled ?? true,
      label: 'Activación beta sin costo',
      chargedAmount: 0,
      renewsAutomatically: false,
    },
  }
}

export async function resolveEffectivePlan(venueId: string, at = new Date()): Promise<EffectivePlan> {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      userId: true,
      claimedBy: true,
      user: { select: { role: true } },
      businessAccountId: true,
      planOverrides: {
        where: {
          status: 'ACTIVE',
          startsAt: { lte: at },
          OR: [{ endsAt: null }, { endsAt: { gt: at } }],
        },
        orderBy: { startsAt: 'desc' },
        take: 1,
        include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } } },
      },
    },
  })
  if (!venue) return freeEffectivePlan()

  const overrideRecord = venue.planOverrides[0]
  if (overrideRecord) return effectiveVersion(overrideRecord.planVersion, 'ADMIN_OVERRIDE', overrideRecord.startsAt)

  // Editorial venues seeded and operated by the global admin are not paid
  // business accounts. Keep their existing public catalogue capabilities
  // while they have no claimant; a claimed venue immediately follows the
  // normal account/subscription path below.
  if (venue.user.role === 'ADMIN' && !venue.claimedBy) {
    const editorialVersion = await latestPublishedVersion('pro')
    if (editorialVersion) return toEffectivePlan(editorialVersion, 'INHERITED')
  }

  let accountId = venue.businessAccountId
  if (!accountId) {
    const legacy = await prisma.businessAccount.findFirst({ where: { ownerId: venue.userId }, select: { id: true } })
    accountId = legacy?.id ?? null
  }
  if (!accountId) return freeEffectivePlan()

  const subscription = await prisma.subscription.findFirst({
    where: { accountId, status: 'ACTIVE', startsAt: { lte: at }, endsAt: { gt: at } },
    orderBy: { startsAt: 'desc' },
    include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } } },
  })
  return subscription ? effectiveVersion(subscription.planVersion, 'INHERITED', subscription.startsAt) : freeEffectivePlan()
}

export function projectPublicVenue<T extends {
  media: Array<unknown>
  menuCategories: Array<{ items: Array<unknown> }>
  products: Array<unknown>
  promotions: Array<unknown>
  events: Array<unknown>
}>(venue: T, plan: EffectivePlan): T & {
  effectivePlan: { slug: string; name: string; source: EffectivePlan['source'] }
  capabilities: PlanCapabilities
  entitlementsVersion: string
} {
  const capabilities = plan.capabilities
  const startedAt = plan.entitlementStartedAt?.getTime() ?? null
  const createdBeforeCurrentEntitlement = (value: { createdAt?: Date | string }) => {
    if (startedAt === null || !value.createdAt) return false
    return new Date(value.createdAt).getTime() < startedAt
  }
  const now = Date.now()
  const preservedPromotions = venue.promotions.filter((entry) => {
    const promotion = entry as { createdAt?: Date | string; validUntil?: Date | string; status?: string }
    return createdBeforeCurrentEntitlement(promotion)
      && promotion.status !== 'CANCELLED'
      && (!promotion.validUntil || new Date(promotion.validUntil).getTime() >= now)
  })
  const preservedEvents = venue.events.filter((entry) => {
    const event = entry as { createdAt?: Date | string; startDate?: Date | string; endDate?: Date | string | null; status?: string }
    return createdBeforeCurrentEntitlement(event)
      && !['CANCELLED', 'REJECTED'].includes(event.status ?? '')
      && new Date(event.endDate ?? event.startDate ?? 0).getTime() >= now
  })
  return {
    ...venue,
    media: capabilities.maxMediaPerVenue === null ? venue.media : venue.media.slice(0, Math.max(0, capabilities.maxMediaPerVenue)),
    menuCategories: capabilities.menuEnabled ? venue.menuCategories : [],
    products: capabilities.menuEnabled ? venue.products : [],
    promotions: capabilities.maxActivePromotionsPerVenue === null || (capabilities.maxActivePromotionsPerVenue ?? 0) > 0 ? venue.promotions : preservedPromotions,
    events: capabilities.monthlyEventsPerVenue === null || (capabilities.monthlyEventsPerVenue ?? 0) > 0 ? venue.events : preservedEvents,
    effectivePlan: {
      slug: plan.slug,
      name: plan.name,
      source: plan.source,
    },
    capabilities,
    entitlementsVersion: plan.entitlementsVersion,
  } as T & {
    effectivePlan: { slug: string; name: string; source: EffectivePlan['source'] }
    capabilities: PlanCapabilities
    entitlementsVersion: string
  }
}

export async function getPlanForUser(userId: string): Promise<EffectivePlan> {
  const account = await getBusinessAccountForUser(userId)
  if (!account) return freeEffectivePlan()
  const subscription = await prisma.subscription.findFirst({
    where: { accountId: account.id, status: 'ACTIVE', startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
    orderBy: { startsAt: 'desc' },
    include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } } },
  })
  return subscription ? effectiveVersion(subscription.planVersion, 'INHERITED', subscription.startsAt) : freeEffectivePlan()
}

async function planContextForAccount(accountId: string, db: Db = prisma) {
  const subscription = await db.subscription.findFirst({
    where: { accountId, status: 'ACTIVE', startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
    orderBy: { startsAt: 'desc' },
    include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } } },
  })
  return subscription ? effectiveVersion(subscription.planVersion, 'INHERITED', subscription.startsAt) : freeEffectivePlan()
}

function fail(code: BillingErrorCode, plan: EffectivePlan, usage: number, limit: number | null, recommendedPlan: string | null): never {
  const labels: Record<BillingErrorCode, string> = {
    PLAN_REQUIRED: 'Esta función requiere un plan superior.',
    LOCATION_LIMIT_REACHED: 'Alcanzaste el límite de ubicaciones de tu plan.',
    MEDIA_LIMIT_REACHED: 'Alcanzaste el límite de multimedia de este local.',
    EVENT_LIMIT_REACHED: 'Alcanzaste el límite mensual de eventos de este local.',
    PROMOTION_LIMIT_REACHED: 'Alcanzaste el límite de promociones activas de este local.',
    MEMBER_LIMIT_REACHED: 'Alcanzaste el límite de miembros de tu cuenta.',
    FEATURE_NOT_INCLUDED: 'Esta función no está incluida en tu plan.',
  }
  throw new BillingEntitlementError(code, labels[code], { plan: plan.slug, usage, limit, recommendedPlan })
}

export async function assertLocationCapacity(userId: string) {
  const account = await getBusinessAccountForUser(userId)
  const plan = account ? await planContextForAccount(account.id) : freeEffectivePlan()
  const usage = account ? await prisma.venue.count({ where: { businessAccountId: account.id } }) : await prisma.venue.count({ where: { userId } })
  if (plan.capabilities.maxLocations !== null && usage >= plan.capabilities.maxLocations) {
    fail(BILLING_ERROR_CODES.LOCATION_LIMIT_REACHED, plan, usage, plan.capabilities.maxLocations, plan.slug === 'free' ? 'plus' : 'pro')
  }
  return { plan, usage, limit: plan.capabilities.maxLocations }
}

/** Ownership guard shared by web actions and future mobile editors. */
export async function canManageVenue(userId: string, venueId: string, roles: string[] = ['OWNER', 'ADMIN', 'EDITOR']) {
  const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { userId: true, claimedBy: true, businessAccountId: true } })
  if (!venue) return false
  if (venue.userId === userId || venue.claimedBy === userId) return true
  if (!venue.businessAccountId) return false
  const membership = await prisma.businessMembership.findUnique({ where: { accountId_userId: { accountId: venue.businessAccountId, userId } }, select: { role: true } })
  return !!membership && roles.includes(membership.role)
}

export async function assertMemberCapacity(accountId: string, db: Db = prisma) {
  const plan = await planContextForAccount(accountId, db)
  const usage = await db.businessMembership.count({ where: { accountId } })
  if (plan.capabilities.maxMembers !== null && usage >= plan.capabilities.maxMembers) {
    fail(BILLING_ERROR_CODES.MEMBER_LIMIT_REACHED, plan, usage, plan.capabilities.maxMembers, plan.slug === 'free' ? 'plus' : 'pro')
  }
  return { plan, usage, limit: plan.capabilities.maxMembers }
}

export async function assertVenueCapability(venueId: string, capability: keyof Pick<PlanCapabilities, 'menuEnabled' | 'servicesEnabled' | 'whatsappEnabled' | 'messagingEnabled' | 'reservationsEnabled'>) {
  const plan = await resolveEffectivePlan(venueId)
  if (!plan.capabilities[capability]) fail(BILLING_ERROR_CODES.FEATURE_NOT_INCLUDED, plan, 0, 1, plan.slug === 'free' ? 'plus' : 'pro')
  return plan
}

export async function assertMediaCapacity(venueId: string) {
  const plan = await resolveEffectivePlan(venueId)
  const usage = await prisma.media.count({ where: { venueId } })
  if (plan.capabilities.maxMediaPerVenue !== null && usage >= plan.capabilities.maxMediaPerVenue) {
    fail(BILLING_ERROR_CODES.MEDIA_LIMIT_REACHED, plan, usage, plan.capabilities.maxMediaPerVenue, plan.slug === 'free' ? 'plus' : 'pro')
  }
  return { plan, usage, limit: plan.capabilities.maxMediaPerVenue }
}

export async function assertEventCapacity(venueId: string, now = new Date()) {
  const plan = await resolveEffectivePlan(venueId, now)
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const usage = await prisma.event.count({ where: { venueId, createdAt: { gte: periodStart, lt: periodEnd } } })
  if (plan.capabilities.monthlyEventsPerVenue !== null && usage >= plan.capabilities.monthlyEventsPerVenue) {
    fail(BILLING_ERROR_CODES.EVENT_LIMIT_REACHED, plan, usage, plan.capabilities.monthlyEventsPerVenue, plan.slug === 'free' ? 'plus' : 'pro')
  }
  return { plan, usage, limit: plan.capabilities.monthlyEventsPerVenue }
}

export async function assertPromotionCapacity(venueId: string) {
  const plan = await resolveEffectivePlan(venueId)
  const usage = await prisma.promotion.count({ where: { venueId, status: 'ACTIVE', validUntil: { gte: new Date() } } })
  if (plan.capabilities.maxActivePromotionsPerVenue !== null && usage >= plan.capabilities.maxActivePromotionsPerVenue) {
    fail(BILLING_ERROR_CODES.PROMOTION_LIMIT_REACHED, plan, usage, plan.capabilities.maxActivePromotionsPerVenue, plan.slug === 'free' ? 'plus' : 'pro')
  }
  return { plan, usage, limit: plan.capabilities.maxActivePromotionsPerVenue }
}

export function billingErrorResponse(error: unknown) {
  if (!(error instanceof BillingEntitlementError)) return null
  return {
    code: error.code,
    message: error.message,
    context: error.context,
  }
}
