import { expect, test, type Page } from '@playwright/test'

function watchImageFailures(page: Page) {
  const failures: string[] = []

  page.on('response', (response) => {
    if (response.url().includes('/_next/image') && response.status() >= 400) {
      failures.push(`${response.status()} ${response.url()}`)
    }
  })

  return failures
}

test('home serves a bounded open-now section without broken optimized images', async ({ page, request }) => {
  const imageFailures = watchImageFailures(page)
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' })

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Abiertos ahora' })).toBeVisible()
  expect(imageFailures).toEqual([])

  const mobileHome = await request.get('/api/mobile/v1/home')
  expect(mobileHome.ok()).toBeTruthy()
  const payload = await mobileHome.json()
  const openNow = payload.data.sections.find((section: { type: string }) => section.type === 'openNow')

  expect(openNow).toBeTruthy()
  expect(openNow.items).toHaveLength(12)
})

test.describe('mobile explore', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true })

  test('defers Mapbox until the user requests the map', async ({ page }) => {
    const imageFailures = watchImageFailures(page)
    const mapboxRequests: string[] = []
    page.on('request', (request) => {
      const hostname = new URL(request.url()).hostname
      if (hostname === 'api.mapbox.com' || hostname.endsWith('.mapbox.com')) {
        mapboxRequests.push(request.url())
      }
    })

    const response = await page.goto('/explorar', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('button', { name: 'Lista', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Mapa disponible bajo demanda')).toBeHidden()
    expect(mapboxRequests).toEqual([])

    await page.getByRole('button', { name: 'Mapa', exact: true }).click()
    await expect(page.locator('.mapboxgl-canvas')).toBeVisible({ timeout: 15_000 })
    expect(mapboxRequests.length).toBeGreaterThan(0)
    expect(imageFailures).toEqual([])
  })
})

test('public discovery pages are cacheable', async ({ request }) => {
  for (const path of ['/', '/explorar']) {
    const response = await request.get(path)
    expect(response.ok()).toBeTruthy()
    expect(response.headers()['cache-control']).not.toContain('no-store')
  }
})
