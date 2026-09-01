import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

type TokenResponse = {
  data: {
    accessToken: string
    refreshToken: string
    user: { id: string; email: string; role: string }
  }
}

function jsonRequest(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://localhost/api/mobile/v1${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

test('Apple login fails closed when the provider is not configured', async () => {
  delete process.env.APPLE_CLIENT_ID
  delete process.env.APPLE_BUNDLE_ID
  const { POST } = await import('../src/app/api/mobile/v1/auth/apple/route')
  const response = await POST(new Request('http://localhost/api/mobile/v1/auth/apple', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identityToken: 'x'.repeat(120) }),
  }))
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    error: { code: 'APPLE_NOT_CONFIGURED', message: 'El acceso con Apple aún no está habilitado.' },
  })
})

test('mobile auth and favorites lifecycle is single-use and idempotent', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('requires DATABASE_URL from the ephemeral CI service')
    return
  }

  const [{ POST: register }, { POST: login }, { POST: refresh }, { POST: logout }, favoritesRoute, contentRoute, profileRoute, { prisma }] = await Promise.all([
    import('../src/app/api/mobile/v1/auth/register/route'),
    import('../src/app/api/mobile/v1/auth/login/route'),
    import('../src/app/api/mobile/v1/auth/refresh/route'),
    import('../src/app/api/mobile/v1/auth/logout/route'),
    import('../src/app/api/mobile/v1/me/favorites/route'),
    import('../src/app/api/mobile/v1/content/route'),
    import('../src/app/api/mobile/v1/me/profile/route'),
    import('../src/lib/prisma'),
  ])
  t.after(async () => prisma.$disconnect())

  const email = `mobile-ci-${randomUUID()}@example.com`
  const credentials = { name: 'Mobile CI', email, password: 'valid-password-123' }
  const registered = await register(jsonRequest('/auth/register', credentials))
  assert.equal(registered.status, 200)
  const registeredBody = await registered.json() as TokenResponse
  assert.equal(registeredBody.data.user.email, email)

  const loggedIn = await login(jsonRequest('/auth/login', { email, password: credentials.password }))
  assert.equal(loggedIn.status, 200)
  const loggedInBody = await loggedIn.json() as TokenResponse

  const refreshRequest = () => jsonRequest('/auth/refresh', { refreshToken: loggedInBody.data.refreshToken })
  const rotatedResponses = await Promise.all([refresh(refreshRequest()), refresh(refreshRequest())])
  assert.deepEqual(rotatedResponses.map((response) => response.status).sort(), [200, 401])
  const rotated = (await rotatedResponses.find((response) => response.status === 200)!.json()) as TokenResponse

  const content = await contentRoute.GET(new Request('http://localhost/api/mobile/v1/content'))
  assert.equal(content.status, 200)
  const contentBody = await content.json() as { data: { posts: unknown[]; promotions: unknown[]; routes: unknown[]; collections: unknown[] } }
  assert.ok(Array.isArray(contentBody.data.posts))
  assert.ok(Array.isArray(contentBody.data.promotions))
  assert.ok(Array.isArray(contentBody.data.routes))
  assert.ok(Array.isArray(contentBody.data.collections))

  const pagedContent = await contentRoute.GET(new Request('http://localhost/api/mobile/v1/content?limit=1&postSkip=0'))
  assert.equal(pagedContent.status, 200)
  const pagedBody = await pagedContent.json() as { data: { posts: unknown[] }; meta?: { posts?: { hasMore: boolean; nextSkip: number } } }
  assert.ok((pagedBody.data.posts ?? []).length <= 1)
  assert.equal(typeof pagedBody.meta?.posts?.hasMore, 'boolean')
  assert.equal(typeof pagedBody.meta?.posts?.nextSkip, 'number')

  const venue = await prisma.venue.findFirst({ where: { status: 'APPROVED', isActive: true }, select: { id: true } })
  assert.ok(venue, 'CI seed must provide an approved venue for the favorites contract')
  const authHeaders = { authorization: `Bearer ${rotated.data.accessToken}` }
  const profile = await profileRoute.GET(new Request('http://localhost/api/mobile/v1/me/profile', { headers: authHeaders }))
  assert.equal(profile.status, 200)
  assert.equal(((await profile.json()) as { data: { email: string } }).data.email, email)
  const updatedProfile = await profileRoute.PATCH(new Request('http://localhost/api/mobile/v1/me/profile', {
    method: 'PATCH', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Mobile CI Updated' }),
  }))
  assert.equal(updatedProfile.status, 200)
  assert.equal(((await updatedProfile.json()) as { data: { name: string } }).data.name, 'Mobile CI Updated')
  const favorite = await favoritesRoute.POST(jsonRequest('/me/favorites', { kind: 'venue', itemId: venue.id }, authHeaders))
  assert.equal(favorite.status, 200)
  const listed = await favoritesRoute.GET(new Request('http://localhost/api/mobile/v1/me/favorites', { headers: authHeaders }))
  assert.equal(listed.status, 200)
  assert.equal(((await listed.json()) as { data: Array<{ itemId: string }> }).data.some((item) => item.itemId === venue.id), true)
  const removed = await favoritesRoute.DELETE(jsonRequest('/me/favorites', { kind: 'venue', itemId: venue.id }, authHeaders))
  assert.equal(removed.status, 200)

  const signedOut = await logout(jsonRequest('/auth/logout', { refreshToken: rotated.data.refreshToken }))
  assert.equal(signedOut.status, 200)
  const rejected = await refresh(refreshRequest())
  assert.equal(rejected.status, 401)
})
