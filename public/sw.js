/* Vive Loja service worker.
 *
 * Hand-written on purpose: the app only needs Web Push delivery plus a small
 * runtime cache, and a build-time precache plugin would have to be wired into
 * the Next 16 webpack build for no extra benefit here.
 *
 * Bump CACHE_VERSION to evict every cached response after a shape change.
 */

const CACHE_VERSION = 'v1'
const RUNTIME_CACHE = `viveloja-runtime-${CACHE_VERSION}`
const OFFLINE_URL = '/'

self.addEventListener('install', (event) => {
  // The shell is cached so a cold offline launch of the installed app shows the
  // site instead of the browser's error page.
  event.waitUntil(
    caches
      .open(RUNTIME_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== RUNTIME_CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

function isCacheableImage(request, url) {
  return request.destination === 'image' && url.origin === self.location.origin
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Session, personalised data and Server Actions must never be served stale.
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    // Network-first: content changes constantly, the cache is only a fallback.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined)
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    )
    return
  }

  if (isCacheableImage(request, url)) {
    // Stale-while-revalidate: images are immutable enough to show instantly.
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone())
              return response
            })
            .catch(() => cached)
          return cached || network
        })
      )
    )
  }
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Vive Loja', body: event.data.text() }
  }

  const title = payload.title || 'Vive Loja'
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    image: payload.image,
    // Same canonical URL the iOS payload carries, so a tap lands on the same
    // page on every surface.
    data: { url: payload.url || '/', ...payload.data },
    tag: payload.tag,
    renotify: Boolean(payload.tag),
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin)

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // Reuse an open tab instead of piling up windows.
        if (client.url === target.href && 'focus' in client) return client.focus()
      }
      for (const client of clientList) {
        if ('navigate' in client && 'focus' in client) {
          return client.navigate(target.href).then((navigated) => navigated && navigated.focus())
        }
      }
      return self.clients.openWindow(target.href)
    })
  )
})
