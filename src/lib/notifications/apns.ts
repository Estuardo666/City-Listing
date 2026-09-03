import 'server-only'
import http2 from 'node:http2'

import { SignJWT, importPKCS8 } from 'jose'

/**
 * APNs over HTTP/2 with token-based (p8) authentication.
 *
 * Everything is created lazily — like `lib/storage/r2` — so a build or a CI run
 * without Apple credentials still compiles and imports this module. Callers get
 * `configured: false` instead of a throw.
 */

const PRODUCTION_HOST = 'https://api.push.apple.com'
const SANDBOX_HOST = 'https://api.sandbox.push.apple.com'
/** Apple rejects tokens older than 1 h and refuses more than one per 20 min. */
const TOKEN_TTL_MS = 50 * 60 * 1000

export interface ApnsPayload {
  title: string
  body: string
  /** Deep link opened on tap; read by `PushService` on the app side. */
  deepLink?: string
  data?: Record<string, string>
  collapseId?: string
  badge?: number
  threadId?: string
}

export interface ApnsSendResult {
  ok: boolean
  status: number
  /** True when Apple says the token is dead and the row must be deleted. */
  unregistered: boolean
  reason?: string
}

interface ApnsConfig {
  keyId: string
  teamId: string
  privateKey: string
  bundleId: string
}

export function getApnsConfig(): ApnsConfig | null {
  const keyId = process.env.APNS_KEY_ID?.trim()
  const teamId = process.env.APNS_TEAM_ID?.trim()
  const bundleId = process.env.APNS_BUNDLE_ID?.trim() || process.env.APPLE_BUNDLE_ID?.trim()
  // Vercel env values are single-line, so literal \n are restored here.
  const privateKey = process.env.APNS_PRIVATE_KEY?.replace(/\n/g, '\n').trim()

  if (!keyId || !teamId || !bundleId || !privateKey) return null
  return { keyId, teamId, bundleId, privateKey }
}

export function isApnsConfigured(): boolean {
  return getApnsConfig() !== null
}

let cachedToken: { value: string; expiresAt: number } | null = null

async function getProviderToken(config: ApnsConfig): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now) return cachedToken.value

  const key = await importPKCS8(config.privateKey, 'ES256')
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: config.keyId })
    .setIssuer(config.teamId)
    .setIssuedAt()
    .sign(key)

  cachedToken = { value: token, expiresAt: now + TOKEN_TTL_MS }
  return token
}

/** Exposed for tests and for the credential-rotation path. */
export function resetApnsProviderToken(): void {
  cachedToken = null
}

function buildBody(payload: ApnsPayload): string {
  return JSON.stringify({
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: 'default',
      ...(payload.badge !== undefined ? { badge: payload.badge } : {}),
      ...(payload.threadId ? { 'thread-id': payload.threadId } : {}),
    },
    ...(payload.deepLink ? { deepLink: payload.deepLink } : {}),
    ...payload.data,
  })
}

export async function sendApnsNotification(
  deviceToken: string,
  payload: ApnsPayload,
  environment: string = 'production',
): Promise<ApnsSendResult> {
  const config = getApnsConfig()
  if (!config) {
    return { ok: false, status: 0, unregistered: false, reason: 'APNS_NOT_CONFIGURED' }
  }

  const host = environment === 'sandbox' ? SANDBOX_HOST : PRODUCTION_HOST
  const providerToken = await getProviderToken(config)
  const body = buildBody(payload)

  return new Promise<ApnsSendResult>((resolve) => {
    const client = http2.connect(host)
    let settled = false

    const finish = (result: ApnsSendResult) => {
      if (settled) return
      settled = true
      client.close()
      resolve(result)
    }

    client.on('error', (error) => {
      finish({ ok: false, status: 0, unregistered: false, reason: (error as Error).message })
    })

    const request = client.request({
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      authorization: `bearer ${providerToken}`,
      'apns-topic': config.bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      ...(payload.collapseId ? { 'apns-collapse-id': payload.collapseId.slice(0, 64) } : {}),
      'content-type': 'application/json',
    })

    let status = 0
    let responseBody = ''

    request.setEncoding('utf8')
    request.on('response', (headers) => {
      status = Number(headers[':status'] ?? 0)
    })
    request.on('data', (chunk) => {
      responseBody += chunk
    })
    request.on('error', (error) => {
      finish({ ok: false, status, unregistered: false, reason: (error as Error).message })
    })
    request.on('end', () => {
      let reason: string | undefined
      try {
        reason = responseBody ? (JSON.parse(responseBody) as { reason?: string }).reason : undefined
      } catch {
        reason = responseBody || undefined
      }

      // 410 means the app was uninstalled; 400/BadDeviceToken means the token
      // belongs to the other APNs environment. Both are permanent for this row.
      const unregistered =
        status === 410 || reason === 'Unregistered' || reason === 'BadDeviceToken'

      finish({ ok: status === 200, status, unregistered, reason })
    })

    request.end(body)
  })
}
