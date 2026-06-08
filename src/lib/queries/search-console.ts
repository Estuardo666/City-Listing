import 'server-only'
import { format, subDays } from 'date-fns'
import {
  getSearchAnalytics,
  getSitemaps,
  type SearchAnalyticsRow,
  type SitemapEntry,
} from '@/lib/google/search-console'

export type SearchConsoleSummary = {
  totalClicks: number
  totalImpressions: number
  averageCtr: number
  averagePosition: number
}

export type SearchConsoleTimeSeries = {
  date: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type SearchConsoleQuery = {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type SearchConsolePage = {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type SearchConsoleDevice = {
  device: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type SearchConsoleCountry = {
  country: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type SearchConsoleData = {
  summary: SearchConsoleSummary
  timeSeries: SearchConsoleTimeSeries[]
  topQueries: SearchConsoleQuery[]
  topPages: SearchConsolePage[]
  devices: SearchConsoleDevice[]
  countries: SearchConsoleCountry[]
  sitemaps: SitemapEntry[]
  dateRange: { startDate: string; endDate: string }
}

export type DateRangePreset = '7d' | '28d' | '3m' | '6m' | '12m'

function getDateRange(preset: DateRangePreset): { startDate: string; endDate: string } {
  const endDate = subDays(new Date(), 2)
  let startDate: Date

  switch (preset) {
    case '7d':
      startDate = subDays(endDate, 7)
      break
    case '28d':
      startDate = subDays(endDate, 28)
      break
    case '3m':
      startDate = subDays(endDate, 90)
      break
    case '6m':
      startDate = subDays(endDate, 180)
      break
    case '12m':
      startDate = subDays(endDate, 365)
      break
    default:
      startDate = subDays(endDate, 28)
  }

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  }
}

function calculateSummary(rows: SearchAnalyticsRow[]): SearchConsoleSummary {
  if (rows.length === 0) {
    return { totalClicks: 0, totalImpressions: 0, averageCtr: 0, averagePosition: 0 }
  }

  const totalClicks = rows.reduce((sum, r) => sum + r.clicks, 0)
  const totalImpressions = rows.reduce((sum, r) => sum + r.impressions, 0)
  const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0
  const weightedPosition = rows.reduce((sum, r) => sum + r.position * r.impressions, 0)
  const averagePosition = totalImpressions > 0 ? weightedPosition / totalImpressions : 0

  return { totalClicks, totalImpressions, averageCtr, averagePosition }
}

function mapDeviceCode(code: string): string {
  const map: Record<string, string> = {
    DESKTOP: 'Escritorio',
    MOBILE: 'Móvil',
    TABLET: 'Tablet',
  }
  return map[code] || code
}

function mapCountryCode(code: string): string {
  const map: Record<string, string> = {
    ecu: 'Ecuador',
    col: 'Colombia',
    per: 'Perú',
    usa: 'Estados Unidos',
    mex: 'México',
    arg: 'Argentina',
    chl: 'Chile',
    ven: 'Venezuela',
    esp: 'España',
    bra: 'Brasil',
  }
  return map[code.toLowerCase()] || code.toUpperCase()
}

export async function getSearchConsoleData(
  preset: DateRangePreset = '28d',
): Promise<SearchConsoleData> {
  const { startDate, endDate } = getDateRange(preset)

  const [summaryData, timeSeriesData, queriesData, pagesData, devicesData, countriesData, sitemaps] =
    await Promise.all([
      getSearchAnalytics(undefined, startDate, endDate, [], 1),
      getSearchAnalytics(undefined, startDate, endDate, ['date'], 5000),
      getSearchAnalytics(undefined, startDate, endDate, ['query'], 100),
      getSearchAnalytics(undefined, startDate, endDate, ['page'], 100),
      getSearchAnalytics(undefined, startDate, endDate, ['device'], 10),
      getSearchAnalytics(undefined, startDate, endDate, ['country'], 20),
      getSitemaps().catch(() => []),
    ])

  return {
    summary: calculateSummary(summaryData.rows),
    timeSeries: timeSeriesData.rows.map((r) => ({
      date: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    })),
    topQueries: queriesData.rows.map((r) => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: Math.round(r.position * 10) / 10,
    })),
    topPages: pagesData.rows.map((r) => ({
      page: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: Math.round(r.position * 10) / 10,
    })),
    devices: devicesData.rows.map((r) => ({
      device: mapDeviceCode(r.keys[0]),
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: Math.round(r.position * 10) / 10,
    })),
    countries: countriesData.rows.map((r) => ({
      country: mapCountryCode(r.keys[0]),
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: Math.round(r.position * 10) / 10,
    })),
    sitemaps,
    dateRange: { startDate, endDate },
  }
}

export function isSearchConsoleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN
  )
}
