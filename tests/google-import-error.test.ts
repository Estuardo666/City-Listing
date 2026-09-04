import assert from 'node:assert/strict'
import { test } from 'node:test'
import { googleImportError } from '../src/lib/google/import-error'

test('production referrer rejection is actionable without leaking Google metadata', () => {
  const result = googleImportError(new Error('Google Places API error: 403 - {"error":{"details":[{"reason":"API_KEY_HTTP_REFERRER_BLOCKED","metadata":{"consumer":"private-project"}}]}}'))
  assert.equal(result.code, 'GOOGLE_KEY_REFERRER_BLOCKED')
  assert.equal(result.status, 502)
  assert.match(result.error, /servidor/)
  assert.equal(JSON.stringify(result).includes('private-project'), false)
})

test('distinguishes disabled API, absent key, quota and unknown failures', () => {
  assert.equal(googleImportError(new Error('SERVICE_DISABLED')).code, 'GOOGLE_PLACES_DISABLED')
  assert.equal(googleImportError(new Error('Google Places API key not configured')).code, 'GOOGLE_KEY_MISSING')
  assert.equal(googleImportError(new Error('RESOURCE_EXHAUSTED')).status, 429)
  assert.equal(googleImportError(new Error('API_KEY_INVALID')).code, 'GOOGLE_ACCESS_DENIED')
  assert.equal(googleImportError(new Error('secret')).code, 'GOOGLE_REQUEST_FAILED')
  assert.equal(JSON.stringify(googleImportError(new Error('secret'))).includes('secret'), false)
})
