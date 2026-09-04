import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { getGooglePlacePhoto } from '../src/lib/google/place-photo'
import { GET } from '../src/app/api/venues/[slug]/google-photo/route'
import { prisma } from '../src/lib/prisma'

const originalFindFirst = prisma.venue.findFirst
const originalKey = process.env.GOOGLE_PLACES_API_KEY
const originalRedis = process.env.KV_REST_API_URL
beforeEach(() => { process.env.GOOGLE_PLACES_API_KEY = 'test-key'; delete process.env.KV_REST_API_URL })
afterEach(() => {
  prisma.venue.findFirst = originalFindFirst
  if (originalKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY
  else process.env.GOOGLE_PLACES_API_KEY = originalKey
  if (originalRedis !== undefined) process.env.KV_REST_API_URL = originalRedis
})

const details = { photos: [{ name: 'places/place-1/photos/photo-1', googleMapsUri: 'https://maps.google.com/photo', authorAttributions: [{ displayName: 'Autor', uri: 'https://maps.google.com/author', photoUri: 'https://lh3.googleusercontent.com/avatar' }] }] }

test('fetches fresh photo metadata and returns the direct image with attribution, never credentials', async (t) => {
  const calls: Array<{ url: string; options?: RequestInit }> = []
  t.mock.method(globalThis, 'fetch', async (url: string, options?: RequestInit) => {
    calls.push({ url, options })
    return Response.json(calls.length % 2 ? details : { photoUri: 'https://lh3.googleusercontent.com/photo' })
  })
  const photo = await getGooglePlacePhoto('place-1', 400)
  await getGooglePlacePhoto('place-1', 1200)
  assert.equal(calls.length, 4, 'photo names are never reused between requests')
  assert.ok(calls.every(({ options, url }) => options?.cache === 'no-store' && !url.includes('test-key')))
  assert.ok(calls[1].url.includes('maxWidthPx=400'))
  assert.ok(calls[3].url.includes('maxWidthPx=1200'))
  assert.equal(photo?.authors[0].displayName, 'Autor')
  assert.equal(photo?.googleMapsUri, details.photos[0].googleMapsUri)
  assert.equal(JSON.stringify(photo).includes('test-key'), false)
})

test('no photo or missing attribution leaves the placeholder and makes no media call', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ photos: [{ name: 'places/place-1/photos/no-source' }] }) })
  assert.equal(await getGooglePlacePhoto('place-1', 400), null)
  assert.equal(calls, 1)
})

test('missing API key makes no upstream request', async (t) => {
  delete process.env.GOOGLE_PLACES_API_KEY
  t.mock.method(globalThis, 'fetch', async () => { assert.fail('must not call Google') })
  assert.equal(await getGooglePlacePhoto('place-1', 400), null)
})

test('public endpoint restricts lookup to approved venues and skips Google without a linked place', async (t) => {
  prisma.venue.findFirst = (async (query: any) => {
    assert.deepEqual(query.where, { slug: 'local', status: 'APPROVED', isActive: true })
    return null
  }) as any
  t.mock.method(globalThis, 'fetch', async () => { assert.fail('must not call Google') })
  const response = await GET(new Request('https://viveloja.test/api/venues/local/google-photo'), { params: Promise.resolve({ slug: 'local' }) })
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store, max-age=0')
  assert.deepEqual(await response.json(), { photo: null })
})

test('public endpoint bounds photo size and returns no-store metadata', async (t) => {
  prisma.venue.findFirst = (async () => ({ googlePlaceId: 'place-1' })) as any
  let calls = 0
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    calls++
    if (calls === 1) return Response.json(details)
    assert.ok(url.includes('maxWidthPx=400'))
    return Response.json({ photoUri: 'https://lh3.googleusercontent.com/photo' })
  })
  const response = await GET(new Request('https://viveloja.test/api/venues/local/google-photo?size=99999'), { params: Promise.resolve({ slug: 'local' }) })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).photo.authors[0].displayName, 'Autor')
})

test('upstream failure does not leak errors or credentials to visitors', async (t) => {
  prisma.venue.findFirst = (async () => ({ googlePlaceId: 'place-1' })) as any
  t.mock.method(globalThis, 'fetch', async () => new Response('secret upstream error', { status: 403 }))
  const response = await GET(new Request('https://viveloja.test/api/venues/local/google-photo'), { params: Promise.resolve({ slug: 'local' }) })
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { photo: null })
})
