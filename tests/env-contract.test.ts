import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const canonicalKeys = [
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
  'UPSTASH_SEARCH_REST_URL',
  'UPSTASH_SEARCH_REST_TOKEN',
  'R2_ENDPOINT',
  'R2_BUCKET_NAME',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_PUBLIC_BASE_URL',
] as const

const sensitiveKeys = new Set([
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'NEXTAUTH_SECRET',
  'KV_REST_API_TOKEN',
  'UPSTASH_SEARCH_REST_TOKEN',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'RESEND_API_KEY',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_PLACES_API_KEY',
  'GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN',
  'CLOUDFLARE_TURNSTILE_SECRET_KEY',
  'AI_ENCRYPTION_KEY',
])

function parseExample(raw: string): Map<string, string> {
  const values = new Map<string, string>()
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator <= 0) continue
    values.set(trimmed.slice(0, separator), trimmed.slice(separator + 1))
  }
  return values
}

test('env example declares canonical integrations without real secrets', async () => {
  const raw = await readFile(new URL('../.env.example', import.meta.url), 'utf8')
  const gitignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8')
  const values = parseExample(raw)

  for (const key of canonicalKeys) {
    assert.ok(values.has(key), `Falta la variable canónica ${key}`)
  }

  for (const [key, value] of values) {
    if (sensitiveKeys.has(key)) assert.equal(value, '', `${key} no debe tener un valor real`)
  }

  assert.doesNotMatch(raw, /(?:uptash_redish|listing_)[A-Z0-9_]+=/)
  assert.match(gitignore, /\.env\.\*/)
  assert.match(gitignore, /credentials\//)
})
