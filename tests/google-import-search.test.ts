import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildSearchPlan, isWithinSearchRadius } from '../src/lib/google/search-plan'
import { GOOGLE_CATEGORIES } from '../src/types/google-import'
import { googlePlacesService } from '../src/lib/google-places'
import { googlePlacesImporter } from '../src/lib/google/google-places-importer'

const center = { lat: -3.993, lng: -79.204 }
const place = (id: string) => ({ id, displayName: { text: id }, location: { latitude: center.lat, longitude: center.lng } })

test('all categories have a city pass and nine bounded sector passes', () => {
  const keys = Object.keys(GOOGLE_CATEGORIES)
  const plan = buildSearchPlan(center, 5000, keys)
  assert.equal(plan.length, keys.length * 10)
  assert.equal(new Set(plan.slice(0, keys.length).map((p) => p.query)).size, keys.length)
  const whole = plan[0].area
  for (const { area } of plan.slice(keys.length)) {
    assert.ok(area.low.latitude >= whole.low.latitude)
    assert.ok(area.high.latitude <= whole.high.latitude + 1e-10)
    assert.ok(area.low.longitude >= whole.low.longitude - 1e-10)
    assert.ok(area.high.longitude <= whole.high.longitude + 1e-10)
  }
  assert.equal(buildSearchPlan(center, 1000, ['restaurant', 'restaurant', '__proto__']).length, 10)
})

test('radius excludes rectangle corners and places without coordinates', () => {
  assert.equal(isWithinSearchRadius(place('a').location, center, 1000), true)
  assert.equal(isWithinSearchRadius({ latitude: center.lat + 0.008, longitude: center.lng + 0.008 }, center, 1000), false)
  assert.equal(isWithinSearchRadius(undefined, center, 1000), false)
})

test('pagination survives empty pages, includes later categories, and deduplicates', async (t) => {
  const calls: Array<{ query: string; token?: string }> = []
  t.mock.method(googlePlacesService, 'searchPlaces', async (query: string, options: { pageToken?: string }) => {
    calls.push({ query, token: options.pageToken })
    if (calls.length === 1) return { places: [], nextPageToken: 'page-2' }
    return { places: [place('same'), place(query)] }
  })
  const results = await googlePlacesImporter.searchPlaces('Loja', center, 1000, ['restaurant', 'bakery'], 1000)
  assert.equal(calls.length, 21)
  assert.equal(calls[1].token, 'page-2')
  assert.equal(calls[0].query, calls[1].query)
  assert.ok(results.some((p) => p.id === 'Panaderías'))
  assert.equal(results.filter((p) => p.id === 'same').length, 1)
})

test('API failures propagate instead of being treated as empty completed searches', async (t) => {
  t.mock.method(googlePlacesService, 'searchPlaces', async () => { throw new Error('quota') })
  await assert.rejects(googlePlacesImporter.searchPlacesPage('', center, 1000, 0, ['restaurant']), /quota/)
})

test('Text Search uses pageSize, rectangle restriction and stable pagination parameters', async (t) => {
  const bodies: any[] = []
  t.mock.method(googlePlacesService as any, 'makeRequest', async (_url: string, options: RequestInit) => {
    bodies.push(JSON.parse(options.body as string))
    return { places: [], nextPageToken: 'next' }
  })
  const options = { locationRestriction: buildSearchPlan(center, 1000, ['restaurant'])[0].area, maxResultCount: 20 }
  await googlePlacesService.searchPlaces('Restaurantes', options)
  await googlePlacesService.searchPlaces('Restaurantes', { ...options, pageToken: 'next' })
  assert.equal(bodies[0].pageSize, 20)
  assert.equal(bodies[0].locationBias, undefined)
  assert.ok(bodies[0].locationRestriction.rectangle)
  const { pageToken, ...rest } = bodies[1]
  assert.equal(pageToken, 'next')
  assert.deepEqual(rest, bodies[0])
})
