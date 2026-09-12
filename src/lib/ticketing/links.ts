const DEFAULT_TICKETING_BASE_URL = 'https://viveloja.com'

/**
 * Keep ticket links valid even if a hosting environment variable was pasted
 * with Markdown formatting or an accidental line break.
 */
export function ticketingBaseUrl(value?: string | null) {
  const configured = value?.trim()
  if (!configured) return DEFAULT_TICKETING_BASE_URL

  try {
    const url = new URL(configured)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return DEFAULT_TICKETING_BASE_URL
    return url.origin
  } catch {
    return DEFAULT_TICKETING_BASE_URL
  }
}

export function ticketScanUrl(token: string, baseUrl?: string) {
  const configuredBaseUrl = baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
  const url = new URL('/tickets/scan', ticketingBaseUrl(configuredBaseUrl))
  url.searchParams.set('token', token)
  return url.toString()
}
