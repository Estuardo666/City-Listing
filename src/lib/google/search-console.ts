import { google, type webmasters_v3 } from 'googleapis'

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

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set')
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/search-console/callback`,
  )

  if (refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    })
  }

  return oauth2Client
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client()

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

function getWebmastersClient(auth: InstanceType<typeof google.auth.OAuth2>): webmasters_v3.Webmasters {
  return google.webmasters({ version: 'v3', auth })
}

export async function getSearchAnalytics(
  siteUrl: string = DEFAULT_SITE_URL,
  startDate: string,
  endDate: string,
  dimensions: Array<'query' | 'page' | 'country' | 'device' | 'searchAppearance' | 'date'> = [],
  rowLimit: number = 1000,
  startRow: number = 0,
): Promise<SearchAnalyticsResponse> {
  const auth = getOAuth2Client()
  const webmasters = getWebmastersClient(auth)

  const response = await webmasters.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions,
      rowLimit,
      startRow,
      dataState: 'ALL',
    },
  })

  return {
    rows: (response.data.rows || []).map((row) => ({
      keys: row.keys || [],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    })),
    responseAggregationType: response.data.responseAggregationType || 'auto',
  }
}

export async function getSitemaps(
  siteUrl: string = DEFAULT_SITE_URL,
): Promise<SitemapEntry[]> {
  const auth = getOAuth2Client()
  const webmasters = getWebmastersClient(auth)

  const response = await webmasters.sitemaps.list({ siteUrl })

  return (response.data.sitemap || []).map((sitemap) => ({
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
  const auth = getOAuth2Client()
  const webmasters = getWebmastersClient(auth)

  await webmasters.sitemaps.submit({ siteUrl, feedpath })
}

export async function deleteSitemap(
  siteUrl: string = DEFAULT_SITE_URL,
  feedpath: string,
): Promise<void> {
  const auth = getOAuth2Client()
  const webmasters = getWebmastersClient(auth)

  await webmasters.sitemaps.delete({ siteUrl, feedpath })
}

export async function getSiteInfo(
  siteUrl: string = DEFAULT_SITE_URL,
) {
  const auth = getOAuth2Client()
  const webmasters = getWebmastersClient(auth)

  const response = await webmasters.sites.get({ siteUrl })

  return {
    siteUrl: response.data.siteUrl,
    permissionLevel: response.data.permissionLevel,
  }
}

export async function listSites() {
  const auth = getOAuth2Client()
  const webmasters = getWebmastersClient(auth)

  const response = await webmasters.sites.list()

  return (response.data.siteEntry || []).map((site) => ({
    siteUrl: site.siteUrl,
    permissionLevel: site.permissionLevel,
  }))
}
