import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'

import {
  DEEP_LINK_PATH_PATTERNS,
  SHAREABLE_KINDS,
  SITE_URL,
  canonicalPath,
  canonicalUrl,
  kindFromSegment,
} from '../src/lib/canonical-urls'

const originalEnv = { ...process.env }

after(() => {
  process.env = originalEnv
})

describe('canonical urls', () => {
  it('covers every shareable kind with a deep link pattern', () => {
    assert.equal(DEEP_LINK_PATH_PATTERNS.length, SHAREABLE_KINDS.length)
    for (const kind of SHAREABLE_KINDS) {
      const path = canonicalPath(kind, 'prueba')
      const pattern = path.replace('/prueba', '/*')
      assert.ok(
        DEEP_LINK_PATH_PATTERNS.includes(pattern),
        `${kind} resolves to ${path} but no pattern claims it`,
      )
    }
  })

  it('uses the Spanish web segments the site actually serves', () => {
    assert.equal(canonicalPath('venue', 'cafe-loja'), '/locales/cafe-loja')
    assert.equal(canonicalPath('event', 'concierto'), '/eventos/concierto')
    assert.equal(canonicalPath('post', 'nota'), '/blog/nota')
    assert.equal(canonicalPath('watchEvent', 'final'), '/partidos/final')
    assert.equal(canonicalPath('route', 'centro'), '/rutas/centro')
    assert.equal(canonicalPath('collection', 'cafeterias'), '/colecciones/cafeterias')
  })

  it('round-trips every segment back to its kind', () => {
    for (const kind of SHAREABLE_KINDS) {
      const segment = canonicalPath(kind, 'x').split('/')[1]
      assert.equal(kindFromSegment(segment), kind)
      assert.equal(kindFromSegment(segment.toUpperCase()), kind)
    }
    assert.equal(kindFromSegment('admin'), null)
  })

  it('builds absolute urls without a double slash', () => {
    // Resolved from NEXT_PUBLIC_APP_URL, which differs per environment — CI
    // runs against localhost — so the origin comes from the module itself.
    assert.equal(canonicalUrl('route', 'centro'), `${SITE_URL}/rutas/centro`)
    assert.ok(!SITE_URL.endsWith('/'))
    assert.ok(!canonicalUrl('route', 'centro').includes('//rutas'))
  })
})

describe('apple-app-site-association', () => {
  async function loadRoute() {
    // Imported lazily so each case sees the env it just set.
    const mod = await import(
      `../src/app/.well-known/apple-app-site-association/route?cache=${Math.random()}`
    )
    return mod.GET as () => Response
  }

  it('fails closed when the team id is missing', async () => {
    delete process.env.APPLE_TEAM_ID
    const GET = await loadRoute()
    const response = GET()
    assert.equal(response.status, 404)
  })

  it('claims every deep link path and enables webcredentials', async () => {
    process.env.APPLE_TEAM_ID = 'ABCDE12345'
    process.env.APPLE_BUNDLE_ID = 'com.viveloja.app'
    const GET = await loadRoute()
    const response = GET()
    assert.equal(response.status, 200)

    const body = (await response.json()) as {
      applinks: { details: { appIDs: string[]; components: Record<string, string>[] }[] }
      webcredentials: { apps: string[] }
    }
    const detail = body.applinks.details[0]
    assert.deepEqual(detail.appIDs, ['ABCDE12345.com.viveloja.app'])
    assert.deepEqual(
      detail.components.map((component) => component['/']),
      DEEP_LINK_PATH_PATTERNS,
    )
    assert.deepEqual(body.webcredentials.apps, ['ABCDE12345.com.viveloja.app'])
  })
})

describe('assetlinks.json', () => {
  async function loadRoute() {
    const mod = await import(`../src/app/.well-known/assetlinks.json/route?cache=${Math.random()}`)
    return mod.GET as () => Response
  }

  it('fails closed without a package name or fingerprints', async () => {
    delete process.env.ANDROID_PACKAGE_NAME
    delete process.env.ANDROID_SHA256_FINGERPRINTS
    assert.equal((await loadRoute())().status, 404)

    process.env.ANDROID_PACKAGE_NAME = 'com.viveloja.app'
    assert.equal((await loadRoute())().status, 404)
  })

  it('emits one statement per signing fingerprint target', async () => {
    process.env.ANDROID_PACKAGE_NAME = 'com.viveloja.app'
    process.env.ANDROID_SHA256_FINGERPRINTS = 'aa:bb , cc:dd'
    const response = (await loadRoute())()
    assert.equal(response.status, 200)

    const body = (await response.json()) as {
      relation: string[]
      target: { package_name: string; sha256_cert_fingerprints: string[] }
    }[]
    assert.equal(body.length, 1)
    assert.deepEqual(body[0].relation, ['delegate_permission/common.handle_all_urls'])
    assert.equal(body[0].target.package_name, 'com.viveloja.app')
    assert.deepEqual(body[0].target.sha256_cert_fingerprints, ['AA:BB', 'CC:DD'])
  })
})
