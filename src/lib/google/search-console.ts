import 'server-only'

export type SearchAnalyticsRow = {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type SearchAnalyticsResponse = {
  rows: SearchAnalyticsRow[]
  responseAggregationType: string
}

export type SitemapEntry = {
  path: string
  lastSubmitted: string | null
  isPending: boolean
  isSitemapsIndex: boolean
  type: string
  lastDownloaded: string | null
  contents: Array<{
    type: string | null
    submitted: string | null
    indexed: string | null
  }>
}

const DEFAULT_SITE_URL = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'sc-domain:viveloja.com'
const WEBMASTERS_BASE = 'https://www.googleapis.com/webmasters/v3'
const OAUTH_BASE = 'https://oauth2.googleapis.com'
const OAUTH_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2'

function getRedirectUri() {
  return `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/search-console/callback`
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Search Console credentials not configured')
  }

  const res = await fetch(`${OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to refresh access token: ${res.status} ${body}`)
  }

  const data = await res.json()
  return data.access_token
}

async function webmastersFetch<T>(
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<T> {
  const accessToken = await getAccessToken()
  const url = `${WEBMASTERS_BASE}${path}`

  const res = await fetch(url, {
    method: options?.method || 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Webmasters API error ${res.status}: ${body}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function getAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID not set')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
  })

  return `${OAUTH_AUTH_BASE}/auth?${params.toString()}`
}

export async function getTokensFromCode(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set')
  }

  const res = await fetch(`${OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: getRedirectUri(),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to exchange code for tokens: ${res.status} ${body}`)
  }

  return res.json()
}

export async function getSearchAnalytics(
  siteUrl: string = DEFAULT_SITE_URL,
  startDate: string,
  endDate: string,
  dimensions: Array<'query' | 'page' | 'country' | 'device' | 'searchAppearance' | 'date'> = [],
  rowLimit: number = 1000,
  startRow: number = 0,
): Promise<SearchAnalyticsResponse> {
  const encodedSiteUrl = encodeURIComponent(siteUrl)
  const data = await webmastersFetch<{
    rows?: Array<{
      keys?: string[]
      clicks?: number
      impressions?: number
      ctr?: number
      position?: number
    }>
    responseAggregationType?: string
  }>(`/sites/${encodedSiteUrl}/searchAnalytics/query`, {
    method: 'POST',
    body: {
      startDate,
      endDate,
      dimensions,
      rowLimit,
      startRow,
      dataState: 'ALL',
    },
  })

  return {
    rows: (data.rows || []).map((row) => ({
      keys: row.keys || [],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    })),
    responseAggregationType: data.responseAggregationType || 'auto',
  }
}

export async function getSitemaps(
  siteUrl: string = DEFAULT_SITE_URL,
): Promise<SitemapEntry[]> {
  const encodedSiteUrl = encodeURIComponent(siteUrl)
  const data = await webmastersFetch<{
    sitemap?: Array<{
      path?: string
      lastSubmitted?: string
      isPending?: boolean
      isSitemapsIndex?: boolean
      type?: string
      lastDownloaded?: string
      contents?: Array<{
        type?: string | null
        submitted?: string | null
        indexed?: string | null
      }>
    }>
  }>(`/sites/${encodedSiteUrl}/sitemaps`)

  return (data.sitemap || []).map((sitemap) => ({
    path: sitemap.path || '',
    lastSubmitted: sitemap.lastSubmitted || null,
    isPending: sitemap.isPending || false,
    isSitemapsIndex: sitemap.isSitemapsIndex || false,
    type: sitemap.type || '',
    lastDownloaded: sitemap.lastDownloaded || null,
    contents: (sitemap.contents || []).map((c) => ({
      type: c.type || null,
      submitted: c.submitted || null,
      indexed: c.indexed || null,
    })),
  }))
}

export async function submitSitemap(
  siteUrl: string = DEFAULT_SITE_URL,
  feedpath: string,
): Promise<void> {
  const encodedSiteUrl = encodeURIComponent(siteUrl)
  const encodedFeedpath = encodeURIComponent(feedpath)
  await webmastersFetch(`/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`, {
    method: 'PUT',
  })
}

export async function deleteSitemap(
  siteUrl: string = DEFAULT_SITE_URL,
  feedpath: string,
): Promise<void> {
  const encodedSiteUrl = encodeURIComponent(siteUrl)
  const encodedFeedpath = encodeURIComponent(feedpath)
  await webmastersFetch(`/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`, {
    method: 'DELETE',
  })
}

export async function getSiteInfo(
  siteUrl: string = DEFAULT_SITE_URL,
) {
  const encodedSiteUrl = encodeURIComponent(siteUrl)
  const data = await webmastersFetch<{
    siteUrl?: string
    permissionLevel?: string
  }>(`/sites/${encodedSiteUrl}`)

  return {
    siteUrl: data.siteUrl,
    permissionLevel: data.permissionLevel,
  }
}

export async function listSites() {
  const data = await webmastersFetch<{
    siteEntry?: Array<{
      siteUrl?: string
      permissionLevel?: string
    }>
  }>('/sites')

  return (data.siteEntry || []).map((site) => ({
    siteUrl: site.siteUrl,
    permissionLevel: site.permissionLevel,
  }))
}
