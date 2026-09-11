import assert from 'node:assert/strict'
import test from 'node:test'
import { projectPublicVenue, type EffectivePlan } from '../src/lib/billing/plans'

const plan = (slug: string, overrides: Partial<EffectivePlan['capabilities']> = {}): EffectivePlan => ({
  slug,
  name: slug,
  versionId: `${slug}-v1`,
  version: 1,
  source: 'INHERITED',
  monthlyPrice: 0,
  annualPrice: 0,
  currency: 'USD',
  entitlementsVersion: `${slug}-v1`,
  entitlementStartedAt: null,
  capabilities: {
    maxLocations: 1, maxMembers: 1, maxMediaPerVenue: 0, googlePhotoEnabled: true,
    menuEnabled: false, servicesEnabled: true, monthlyEventsPerVenue: 0,
    maxActivePromotionsPerVenue: 0, analyticsRetentionDays: null, whatsappEnabled: false,
    messagingEnabled: false, reservationsEnabled: false, priorityModeration: false,
    includedBoostCredits: 0, ...overrides,
  },
})

const venue = {
  media: [{ id: 1 }, { id: 2 }],
  menuCategories: [{ items: [{ id: 1 }] }],
  products: [{ id: 1 }],
  promotions: [{ id: 1 }],
  events: [{ id: 1 }],
}

test('free public projection does not leak gated content', () => {
  const projected = projectPublicVenue(venue, plan('free'))
  assert.equal(projected.media.length, 0)
  assert.equal(projected.menuCategories.length, 0)
  assert.equal(projected.products.length, 0)
  assert.equal(projected.promotions.length, 0)
  assert.equal(projected.events.length, 0)
  assert.equal(projected.effectivePlan.slug, 'free')
})

test('plus public projection caps media without changing stored input', () => {
  const projected = projectPublicVenue(venue, plan('plus', { maxMediaPerVenue: 1, menuEnabled: true, monthlyEventsPerVenue: 4, maxActivePromotionsPerVenue: 2 }))
  assert.equal(projected.media.length, 1)
  assert.equal(projected.menuCategories.length, 1)
  assert.equal(projected.events.length, 1)
  assert.equal(venue.media.length, 2)
})

test('downgrade preserves active promotions and future events created before it', () => {
  const before = new Date('2026-01-01T00:00:00.000Z')
  const downgradedAt = new Date('2026-02-01T00:00:00.000Z')
  const future = new Date(Date.now() + 86_400_000)
  const downgraded = { ...plan('free'), entitlementStartedAt: downgradedAt }
  const projected = projectPublicVenue({
    ...venue,
    promotions: [{ id: 1, createdAt: before, validUntil: future, status: 'APPROVED' }],
    events: [{ id: 1, createdAt: before, startDate: future, status: 'APPROVED' }],
  }, downgraded)
  assert.equal(projected.promotions.length, 1)
  assert.equal(projected.events.length, 1)
})

test('downgrade does not preserve expired, cancelled, or newly-created gated content', () => {
  const downgradedAt = new Date('2026-02-01T00:00:00.000Z')
  const before = new Date('2026-01-01T00:00:00.000Z')
  const after = new Date('2026-03-01T00:00:00.000Z')
  const past = new Date(Date.now() - 86_400_000)
  const future = new Date(Date.now() + 86_400_000)
  const projected = projectPublicVenue({
    ...venue,
    promotions: [
      { id: 1, createdAt: before, validUntil: past, status: 'APPROVED' },
      { id: 2, createdAt: before, validUntil: future, status: 'CANCELLED' },
      { id: 3, createdAt: after, validUntil: future, status: 'APPROVED' },
    ],
    events: [
      { id: 1, createdAt: before, startDate: past, status: 'APPROVED' },
      { id: 2, createdAt: before, startDate: future, status: 'CANCELLED' },
      { id: 3, createdAt: after, startDate: future, status: 'APPROVED' },
    ],
  }, { ...plan('free'), entitlementStartedAt: downgradedAt })
  assert.equal(projected.promotions.length, 0)
  assert.equal(projected.events.length, 0)
})
