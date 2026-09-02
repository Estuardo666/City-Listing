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

test('AASA fails closed without a Team ID and emits configured app links', async () => {
  const previousTeamID = process.env.APPLE_TEAM_ID
  const previousBundleID = process.env.APPLE_BUNDLE_ID
  const { GET } = await import('../src/app/.well-known/apple-app-site-association/route')

  try {
    delete process.env.APPLE_TEAM_ID
    process.env.APPLE_BUNDLE_ID = 'com.viveloja.app'
    assert.equal((await GET()).status, 404)

    process.env.APPLE_TEAM_ID = 'TEAMID123'
    const response = await GET()
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      applinks: {
        details: [{
          appIDs: ['TEAMID123.com.viveloja.app'],
          components: [{ '/': '/locales/*' }, { '/': '/eventos/*' }, { '/': '/blog/*' }, { '/': '/partidos/*' }],
        }],
      },
    })
  } finally {
    if (previousTeamID === undefined) delete process.env.APPLE_TEAM_ID
    else process.env.APPLE_TEAM_ID = previousTeamID
    if (previousBundleID === undefined) delete process.env.APPLE_BUNDLE_ID
    else process.env.APPLE_BUNDLE_ID = previousBundleID
  }
})

test('mobile auth and favorites lifecycle is single-use and idempotent', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('requires DATABASE_URL from the ephemeral CI service')
    return
  }

  const [{ POST: register }, { POST: login }, { POST: refresh }, { POST: logout }, favoritesRoute, contentRoute, homeRoute, venueDetailRoute, profileRoute, followingRoute, badgesRoute, passwordRoute, interestsRoute, recommendationsRoute, watchEventsRoute, watchEventDetailRoute, viewsRoute, reservationsRoute, reservationDetailRoute, messagesRoute, messageDetailRoute, reportMessageRoute, blockMessageRoute, reviewsRoute, questionsRoute, eventsRoute, collectionsRoute, collectionDetailRoute, collectionItemsRoute, checkInsRoute, venuesRoute, postsRoute, routesRoute, { prisma }] = await Promise.all([
    import('../src/app/api/mobile/v1/auth/register/route'),
    import('../src/app/api/mobile/v1/auth/login/route'),
    import('../src/app/api/mobile/v1/auth/refresh/route'),
    import('../src/app/api/mobile/v1/auth/logout/route'),
    import('../src/app/api/mobile/v1/me/favorites/route'),
    import('../src/app/api/mobile/v1/content/route'),
    import('../src/app/api/mobile/v1/home/route'),
    import('../src/app/api/mobile/v1/venues/[slug]/route'),
    import('../src/app/api/mobile/v1/me/profile/route'),
    import('../src/app/api/mobile/v1/me/following/route'),
    import('../src/app/api/mobile/v1/me/badges/route'),
    import('../src/app/api/mobile/v1/me/password/route'),
    import('../src/app/api/mobile/v1/me/interests/route'),
    import('../src/app/api/mobile/v1/me/recommendations/route'),
    import('../src/app/api/mobile/v1/watch-events/route'),
    import('../src/app/api/mobile/v1/watch-events/[slug]/route'),
    import('../src/app/api/mobile/v1/views/route'),
    import('../src/app/api/mobile/v1/me/reservations/route'),
    import('../src/app/api/mobile/v1/me/reservations/[id]/route'),
    import('../src/app/api/mobile/v1/me/messages/route'),
    import('../src/app/api/mobile/v1/me/messages/[conversationId]/route'),
    import('../src/app/api/mobile/v1/me/messages/report/route'),
    import('../src/app/api/mobile/v1/me/messages/block/route'),
    import('../src/app/api/mobile/v1/me/reviews/route'),
    import('../src/app/api/mobile/v1/me/questions/route'),
    import('../src/app/api/mobile/v1/me/events/route'),
    import('../src/app/api/mobile/v1/me/collections/route'),
    import('../src/app/api/mobile/v1/me/collections/[id]/route'),
    import('../src/app/api/mobile/v1/me/collections/[id]/items/route'),
    import('../src/app/api/mobile/v1/me/check-ins/route'),
    import('../src/app/api/mobile/v1/me/venues/route'),
    import('../src/app/api/mobile/v1/me/posts/route'),
    import('../src/app/api/mobile/v1/me/routes/route'),
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
  assert.ok(Array.isArray((contentBody.data as { watchEvents?: unknown[] }).watchEvents))

  const home = await homeRoute.GET()
  assert.equal(home.status, 200)
  const homeBody = await home.json() as {
    data: {
      venues: unknown[]
      events: unknown[]
      featuredVenues: unknown[]
      featuredEvents: unknown[]
      latestVenues: unknown[]
      relatedEvents: unknown[]
      posts: unknown[]
      promotions: unknown[]
    }
  }
  assert.ok(Array.isArray(homeBody.data.venues))
  assert.ok(Array.isArray(homeBody.data.events))
  assert.ok(Array.isArray(homeBody.data.featuredVenues))
  assert.ok(Array.isArray(homeBody.data.featuredEvents))
  assert.ok(Array.isArray(homeBody.data.latestVenues))
  assert.ok(Array.isArray(homeBody.data.relatedEvents))
  assert.ok(Array.isArray(homeBody.data.posts))
  assert.ok(Array.isArray(homeBody.data.promotions))

  const pagedContent = await contentRoute.GET(new Request('http://localhost/api/mobile/v1/content?limit=1&postSkip=0'))
  assert.equal(pagedContent.status, 200)
  const pagedBody = await pagedContent.json() as { data: { posts: unknown[] }; meta?: { posts?: { hasMore: boolean; nextSkip: number } } }
  assert.ok((pagedBody.data.posts ?? []).length <= 1)
  assert.equal(typeof pagedBody.meta?.posts?.hasMore, 'boolean')
  assert.equal(typeof pagedBody.meta?.posts?.nextSkip, 'number')

  const venue = await prisma.venue.findFirst({ where: { status: 'APPROVED', isActive: true }, select: { id: true, name: true, slug: true, description: true, image: true, location: true, address: true, lat: true, lng: true } })
  assert.ok(venue, 'CI seed must provide an approved venue for the favorites contract')
  const authHeaders = { authorization: `Bearer ${rotated.data.accessToken}` }
  const venueDetail = await venueDetailRoute.GET(new Request(`http://localhost/api/mobile/v1/venues/${venue.slug}`), { params: Promise.resolve({ slug: venue.slug }) })
  assert.equal(venueDetail.status, 200)
  const venueDetailBody = await venueDetail.json() as { data: { businessHours: unknown[]; menu: unknown[]; products: unknown[]; events: unknown[]; promotions: unknown[] } }
  assert.ok(Array.isArray(venueDetailBody.data.businessHours))
  assert.ok(Array.isArray(venueDetailBody.data.menu))
  assert.ok(Array.isArray(venueDetailBody.data.products))
  assert.ok(Array.isArray(venueDetailBody.data.events))
  assert.ok(Array.isArray(venueDetailBody.data.promotions))
  const profile = await profileRoute.GET(new Request('http://localhost/api/mobile/v1/me/profile', { headers: authHeaders }))
  assert.equal(profile.status, 200)
  assert.equal(((await profile.json()) as { data: { email: string } }).data.email, email)
  const updatedProfile = await profileRoute.PATCH(new Request('http://localhost/api/mobile/v1/me/profile', {
    method: 'PATCH', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Mobile CI Updated' }),
  }))
  assert.equal(updatedProfile.status, 200)
  assert.equal(((await updatedProfile.json()) as { data: { name: string } }).data.name, 'Mobile CI Updated')
  const badges = await badgesRoute.GET(new Request('http://localhost/api/mobile/v1/me/badges', { headers: authHeaders }))
  assert.equal(badges.status, 200)
  assert.ok(Array.isArray(((await badges.json()) as { data: unknown[] }).data))
  const followed = await followingRoute.POST(new Request('http://localhost/api/mobile/v1/me/following', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ venueId: venue.id }),
  }))
  assert.equal(followed.status, 200)
  assert.equal(((await followed.json()) as { data: { following: boolean } }).data.following, true)
  const following = await followingRoute.GET(new Request('http://localhost/api/mobile/v1/me/following', { headers: authHeaders }))
  assert.equal(following.status, 200)
  assert.ok(((await following.json()) as { data: Array<{ venueId: string }> }).data.some((item) => item.venueId === venue.id))
  const unfollowed = await followingRoute.DELETE(new Request('http://localhost/api/mobile/v1/me/following', {
    method: 'DELETE', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ venueId: venue.id }),
  }))
  assert.equal(unfollowed.status, 200)
  assert.equal(((await unfollowed.json()) as { data: { following: boolean } }).data.following, false)
  const changedPassword = await passwordRoute.PATCH(new Request('http://localhost/api/mobile/v1/me/password', {
    method: 'PATCH', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ currentPassword: credentials.password, newPassword: 'new-valid-password-123', confirmPassword: 'new-valid-password-123' }),
  }))
  assert.equal(changedPassword.status, 200)
  const oldPasswordRejected = await login(jsonRequest('/auth/login', { email, password: credentials.password }))
  assert.equal(oldPasswordRejected.status, 401)
  const newPasswordAccepted = await login(jsonRequest('/auth/login', { email, password: 'new-valid-password-123' }))
  assert.equal(newPasswordAccepted.status, 200)
  const category = await prisma.category.findFirst({ select: { id: true } })
  assert.ok(category, 'CI seed must provide a category for onboarding contract')
  const updatedInterests = await interestsRoute.PUT(new Request('http://localhost/api/mobile/v1/me/interests', {
    method: 'PUT', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ categoryIds: [category!.id], preferences: ['Cultura'] }),
  }))
  assert.equal(updatedInterests.status, 200)
  const listedInterests = await interestsRoute.GET(new Request('http://localhost/api/mobile/v1/me/interests', { headers: authHeaders }))
  assert.equal(listedInterests.status, 200)
  assert.equal(((await listedInterests.json()) as { data: { categories: Array<{ id: string }> } }).data.categories[0].id, category!.id)

  const recommendations = await recommendationsRoute.GET(new Request('http://localhost/api/mobile/v1/me/recommendations', { headers: authHeaders }))
  assert.equal(recommendations.status, 200)
  const recommendationBody = await recommendations.json() as { data: { interests: { categories: unknown[]; preferences: unknown[] }; relatedEvents: unknown[]; relatedVenues: unknown[] } }
  assert.ok(Array.isArray(recommendationBody.data.interests.categories))
  assert.ok(Array.isArray(recommendationBody.data.interests.preferences))
  assert.ok(Array.isArray(recommendationBody.data.relatedEvents))
  assert.ok(Array.isArray(recommendationBody.data.relatedVenues))

  const watchEvents = await watchEventsRoute.GET(new Request('http://localhost/api/mobile/v1/watch-events'))
  assert.equal(watchEvents.status, 200)
  const watchEventBody = await watchEvents.json() as { data: Array<{ id: string; slug: string; performers: unknown[] }> }
  assert.ok(Array.isArray(watchEventBody.data))
  assert.ok(watchEventBody.data.every((event) => Array.isArray(event.performers)))
  if (watchEventBody.data[0]) {
    const watchDetail = await watchEventDetailRoute.GET(new Request(`http://localhost/api/mobile/v1/watch-events/${watchEventBody.data[0].slug}`), { params: Promise.resolve({ slug: watchEventBody.data[0].slug }) })
    assert.equal(watchDetail.status, 200)
    assert.ok(Array.isArray(((await watchDetail.json()) as { data: { venues: unknown[] } }).data.venues))
  }
  const viewBefore = await prisma.venue.findUnique({ where: { id: venue.id }, select: { viewCount: true } })
  const recordedView = await viewsRoute.POST(new Request('http://localhost/api/mobile/v1/views', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'venue', itemId: venue.id }),
  }))
  assert.equal(recordedView.status, 200)
  assert.equal(((await recordedView.json()) as { data: { recorded: boolean } }).data.recorded, true)
  const viewAfter = await prisma.venue.findUnique({ where: { id: venue.id }, select: { viewCount: true } })
  assert.equal(viewAfter!.viewCount, viewBefore!.viewCount + 1)

  const reservationDate = new Date(Date.now() + 86_400_000).toISOString()
  const reservationInput = { venueId: venue.id, date: reservationDate, time: '19:00', partySize: 2, notes: 'CI contract' }
  const reservation = await reservationsRoute.POST(new Request('http://localhost/api/mobile/v1/me/reservations', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify(reservationInput),
  }))
  assert.equal(reservation.status, 200)
  const repeatedReservation = await reservationsRoute.POST(new Request('http://localhost/api/mobile/v1/me/reservations', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify(reservationInput),
  }))
  assert.equal(repeatedReservation.status, 200)
  assert.equal(((await repeatedReservation.json()) as { meta?: { idempotent?: boolean } }).meta?.idempotent, true)
  const reservations = await reservationsRoute.GET(new Request('http://localhost/api/mobile/v1/me/reservations', { headers: authHeaders }))
  assert.equal(reservations.status, 200)
  const reservationBody = (await reservations.json()) as { data: Array<{ id: string }> }
  assert.ok(reservationBody.data.length >= 1)
  const reservationDetail = await reservationDetailRoute.GET(new Request(`http://localhost/api/mobile/v1/me/reservations/${reservationBody.data[0].id}`, { headers: authHeaders }), { params: Promise.resolve({ id: reservationBody.data[0].id }) })
  assert.equal(reservationDetail.status, 200)

  const venueOwner = await prisma.venue.findUnique({ where: { id: venue.id }, select: { userId: true } })
  assert.ok(venueOwner?.userId, 'CI seed venue must have an owner for messaging contract')
  const message = await messagesRoute.POST(new Request('http://localhost/api/mobile/v1/me/messages', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ venueId: venue.id, receiverId: venueOwner!.userId, content: 'Mensaje de contrato CI' }),
  }))
  assert.equal(message.status, 200)
  const conversations = await messagesRoute.GET(new Request('http://localhost/api/mobile/v1/me/messages', { headers: authHeaders }))
  assert.equal(conversations.status, 200)
  const conversationBody = (await conversations.json()) as { data: Array<{ id: string }> }
  assert.ok(conversationBody.data.length >= 1)
  const conversation = conversationBody.data[0]
  const conversationDetail = await messageDetailRoute.GET(new Request(`http://localhost/api/mobile/v1/me/messages/${conversation.id}`, { headers: authHeaders }), { params: Promise.resolve({ conversationId: conversation.id }) })
  assert.equal(conversationDetail.status, 200)
  const markedRead = await messageDetailRoute.PATCH(new Request(`http://localhost/api/mobile/v1/me/messages/${conversation.id}`, { method: 'PATCH', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ read: true }) }), { params: Promise.resolve({ conversationId: conversation.id }) })
  assert.equal(markedRead.status, 200)
  const messageBody = (await message.clone().json()) as { data: { id: string } }
  const reportedMessage = await reportMessageRoute.POST(new Request('http://localhost/api/mobile/v1/me/messages/report', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ messageId: messageBody.data.id, reason: 'SPAM' }),
  }))
  assert.equal(reportedMessage.status, 200)
  assert.equal(((await reportedMessage.json()) as { data: { reported: boolean } }).data.reported, true)
  const messageId = messageBody.data.id
  const blockedMessage = await blockMessageRoute.POST(new Request('http://localhost/api/mobile/v1/me/messages/block', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ venueId: venue.id, userId: venueOwner!.userId, reason: 'CI test' }),
  }))
  assert.equal(blockedMessage.status, 200)
  const rejectedMessage = await messagesRoute.POST(new Request('http://localhost/api/mobile/v1/me/messages', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ venueId: venue.id, receiverId: venueOwner!.userId, content: `Mensaje bloqueado ${messageId}` }),
  }))
  assert.equal(rejectedMessage.status, 403)
  const unblockedMessage = await blockMessageRoute.DELETE(new Request('http://localhost/api/mobile/v1/me/messages/block', {
    method: 'DELETE', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ venueId: venue.id, userId: venueOwner!.userId }),
  }))
  assert.equal(unblockedMessage.status, 200)

  const review = await reviewsRoute.POST(new Request('http://localhost/api/mobile/v1/me/reviews', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ venueId: venue.id, rating: 5, content: 'Excelente lugar para el contrato CI.', photos: ['https://example.com/review-ci.jpg'] }),
  }))
  assert.equal(review.status, 200)
  assert.equal(((await review.clone().json()) as { data: { photos: Array<{ url: string }> } }).data.photos[0].url, 'https://example.com/review-ci.jpg')
  const listedReviews = await reviewsRoute.GET(new Request(`http://localhost/api/mobile/v1/me/reviews?venueId=${venue.id}`, { headers: authHeaders }))
  assert.equal(listedReviews.status, 200)
  assert.ok(((await listedReviews.json()) as { data: unknown[] }).data.length >= 1)
  const question = await questionsRoute.POST(new Request('http://localhost/api/mobile/v1/me/questions', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ venueId: venue.id, content: '¿Cuál es el horario para este contrato?' }),
  }))
  assert.equal(question.status, 200)

  const collection = await collectionsRoute.POST(new Request('http://localhost/api/mobile/v1/me/collections', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Favoritos CI', isPublic: false }),
  }))
  assert.equal(collection.status, 200)
  const collectionId = ((await collection.json()) as { data: { id: string } }).data.id
  const collectionItem = await collectionDetailRoute.POST(new Request(`http://localhost/api/mobile/v1/me/collections/${collectionId}`, {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'venue', itemId: venue.id, note: 'Visitar pronto' }),
  }), { params: Promise.resolve({ id: collectionId }) })
  assert.equal(collectionItem.status, 200)
  const repeatedCollectionItem = await collectionDetailRoute.POST(new Request(`http://localhost/api/mobile/v1/me/collections/${collectionId}`, {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'venue', itemId: venue.id }),
  }), { params: Promise.resolve({ id: collectionId }) })
  assert.equal(((await repeatedCollectionItem.json()) as { meta?: { idempotent?: boolean } }).meta?.idempotent, true)
  const listedCollections = await collectionsRoute.GET(new Request('http://localhost/api/mobile/v1/me/collections', { headers: authHeaders }))
  assert.equal(listedCollections.status, 200)
  assert.ok(((await listedCollections.json()) as { data: Array<{ id: string }> }).data.some((item) => item.id === collectionId))
  const removedCollectionItem = await collectionItemsRoute.DELETE(new Request(`http://localhost/api/mobile/v1/me/collections/${collectionId}/items`, {
    method: 'DELETE', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'venue', itemId: venue.id }),
  }), { params: Promise.resolve({ id: collectionId }) })
  assert.equal(removedCollectionItem.status, 200)

  if (venue.lat != null && venue.lng != null) {
    const checkIn = await checkInsRoute.POST(new Request('http://localhost/api/mobile/v1/me/check-ins', {
      method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ venueId: venue.id, lat: venue.lat, lng: venue.lng, note: 'Visita CI' }),
    }))
    assert.equal(checkIn.status, 200)
    const checkIns = await checkInsRoute.GET(new Request('http://localhost/api/mobile/v1/me/check-ins', { headers: authHeaders }))
    assert.equal(checkIns.status, 200)
    assert.ok(((await checkIns.json()) as { data: Array<{ venueId: string }> }).data.some((item) => item.venueId === venue.id))
  }

  const cancelled = await reservationDetailRoute.PATCH(new Request(`http://localhost/api/mobile/v1/me/reservations/${reservationBody.data[0].id}`, { method: 'PATCH', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({ cancelReason: 'Cambio de planes CI' }) }), { params: Promise.resolve({ id: reservationBody.data[0].id }) })
  assert.equal(cancelled.status, 200)
  assert.equal(((await cancelled.json()) as { data: { status: string } }).data.status, 'CANCELLED')

  const createdEvent = await eventsRoute.POST(new Request('http://localhost/api/mobile/v1/me/events', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({
      title: 'Evento móvil CI', description: 'Evento de prueba para el contrato móvil.', startDate: new Date(Date.now() + 172_800_000).toISOString(), location: 'Centro de Loja', price: 0,
    }),
  }))
  assert.equal(createdEvent.status, 200)
  assert.equal(((await createdEvent.json()) as { data: { status: string }; meta?: { moderation: string } }).data.status, 'PENDING')
  const createdVenue = await venuesRoute.POST(new Request('http://localhost/api/mobile/v1/me/venues', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({
      name: 'Local móvil CI', description: 'Local de prueba para el contrato móvil.', location: 'Centro de Loja', categoryIds: [category!.id],
    }),
  }))
  assert.equal(createdVenue.status, 200)
  assert.equal(((await createdVenue.json()) as { data: { status: string }; meta?: { moderation: string } }).data.status, 'PENDING')
  const createdPost = await postsRoute.POST(new Request('http://localhost/api/mobile/v1/me/posts', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({
      title: 'Artículo móvil CI', content: 'Contenido suficientemente largo para validar el borrador móvil.', categoryId: category!.id,
    }),
  }))
  assert.equal(createdPost.status, 200)
  assert.equal(((await createdPost.json()) as { data: { status: string } }).data.status, 'PENDING')
  const createdRoute = await routesRoute.POST(new Request('http://localhost/api/mobile/v1/me/routes', {
    method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify({
      title: 'Ruta móvil CI', description: 'Ruta de prueba para el contrato móvil.', type: 'cultural', stops: [{ venueId: venue.id, title: 'Primera parada' }],
    }),
  }))
  assert.equal(createdRoute.status, 200)
  assert.equal(((await createdRoute.json()) as { data: { status: string } }).data.status, 'PENDING')
  const favorite = await favoritesRoute.POST(jsonRequest('/me/favorites', { kind: 'venue', itemId: venue.id }, authHeaders))
  assert.equal(favorite.status, 200)
  const listed = await favoritesRoute.GET(new Request('http://localhost/api/mobile/v1/me/favorites', { headers: authHeaders }))
  assert.equal(listed.status, 200)
  const listedData = (await listed.json()) as { data: Array<{ itemId: string; item?: { kind: string; id: string; title: string; slug: string } | null }> }
  const listedFavorite = listedData.data.find((item) => item.itemId === venue.id)
  assert.ok(listedFavorite)
  assert.deepEqual(listedFavorite?.item, { kind: 'venue', id: venue.id, title: venue.name, slug: venue.slug, description: venue.description, image: venue.image, subtitle: venue.location, address: venue.address, lat: venue.lat, lng: venue.lng })
  const removed = await favoritesRoute.DELETE(jsonRequest('/me/favorites', { kind: 'venue', itemId: venue.id }, authHeaders))
  assert.equal(removed.status, 200)

  const signedOut = await logout(jsonRequest('/auth/logout', { refreshToken: rotated.data.refreshToken }))
  assert.equal(signedOut.status, 200)
  const rejected = await refresh(refreshRequest())
  assert.equal(rejected.status, 401)
})
