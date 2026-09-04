import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

test('today filters drafts, private collections, closed venues and expired events; metrics dedupe without Redis', async t => {
  if (!process.env.DATABASE_URL) { t.skip('requires dedicated disposable database'); return }
  process.env.NEXTAUTH_SECRET ||= 'discovery-test-secret'
  const { prisma } = await import('../src/lib/prisma')
  const { getTodayInLoja } = await import('../src/lib/today')
  const { recordDirections, recordSave, getInteractionMetrics } = await import('../src/lib/interactions')
  const { POST } = await import('../src/app/api/mobile/v1/interactions/route')
  const suffix = randomUUID()
  const owner = await prisma.user.create({ data: { name: 'Local editor', email: `${suffix}@example.test`, role: 'ADMIN' } })
  const now = new Date('2026-09-04T15:00:00Z')
  const venue = await prisma.venue.create({ data: { name: 'Open test venue', slug: `open-${suffix}`, description: 'test', location: 'Loja', status: 'APPROVED', userId: owner.id,
    businessHours: { create: { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00' } } } })
  const draft = await prisma.venue.create({ data: { name: 'Draft', slug: `draft-${suffix}`, description: 'test', location: 'Loja', userId: owner.id } })
  const collection = await prisma.collection.create({ data: { name: 'Local tips', slug: `tips-${suffix}`, userId: owner.id,
    items: { create: { venueId: venue.id, note: 'Try the local coffee' } } } })
  await prisma.collection.create({ data: { name: 'Private', slug: `private-${suffix}`, userId: owner.id, isPublic: false,
    items: { create: { venueId: venue.id } } } })
  await prisma.collection.create({ data: { name: 'Draft content', slug: `hidden-${suffix}`, userId: owner.id,
    items: { create: { venueId: draft.id } } } })
  const event = await prisma.event.create({ data: { title: 'Today', slug: `today-${suffix}`, description: 'test', location: 'Loja', userId: owner.id, status: 'APPROVED', startDate: new Date('2026-09-04T16:00:00Z') } })
  await prisma.event.create({ data: { title: 'Past', slug: `past-${suffix}`, description: 'test', location: 'Loja', userId: owner.id, status: 'APPROVED', startDate: new Date('2026-09-04T10:00:00Z'), endDate: new Date('2026-09-04T11:00:00Z') } })
  t.after(async () => {
    await prisma.interactionEvent.deleteMany({ where: { itemId: { in: [venue.id, draft.id] } } })
    await prisma.user.delete({ where: { id: owner.id } })
    await prisma.$disconnect()
  })
  const today = await getTodayInLoja(now)
  assert.ok(today.openVenues.some(v => v.id === venue.id))
  assert.ok(!today.openVenues.some(v => v.id === draft.id))
  assert.ok(today.events.some(e => e.id === event.id))
  assert.ok(!today.events.some(e => e.slug === `past-${suffix}`))
  assert.equal(today.collections.filter(c => c.slug.endsWith(suffix)).length, 1)
  assert.equal(today.collections.find(c => c.id === collection.id)?.author, 'Local editor')
  const request = new Request('http://localhost/api/mobile/v1/interactions', { headers: { 'user-agent': suffix } })
  const results = await Promise.all(Array.from({ length: 5 }, () => recordDirections(request, 'venue', venue.id, 'web')))
  assert.equal(results.filter(r => r.recorded).length, 1)
  assert.equal((await recordDirections(request, 'venue', draft.id, 'ios')).found, false)
  await prisma.$transaction(async tx => {
    const favorite = await tx.favorite.create({ data: { userId: owner.id, venueId: venue.id } })
    await recordSave(tx, favorite.id, 'venue', venue.id, 'ios')
  })
  const metrics = await getInteractionMetrics('venue', venue.id)
  assert.equal(metrics.saves, 1)
  assert.equal(metrics.directions, 1)
  // A failed analytics insert rolls back the new favorite as well: no half-save.
  const first = await prisma.favorite.findFirstOrThrow({ where: { userId: owner.id, venueId: venue.id } })
  await assert.rejects(prisma.$transaction(async tx => {
    await tx.favorite.create({ data: { userId: owner.id, collectionId: collection.id } })
    await recordSave(tx, first.id, 'collection', collection.id, 'ios')
  }))
  assert.equal(await prisma.favorite.count({ where: { userId: owner.id, collectionId: collection.id } }), 0)
  const forgedSave = await POST(new Request(request.url, { method: 'POST', body: JSON.stringify({ action: 'save', kind: 'venue', itemId: venue.id, source: 'web' }) }))
  assert.equal(forgedSave.status, 422)
  const crossOrigin = await POST(new Request(request.url, { method: 'POST', headers: { origin: 'https://evil.example' }, body: '{}' }))
  assert.equal(crossOrigin.status, 403)
})
