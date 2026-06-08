import { prisma } from '@/lib/prisma'
import { getSearchAnalytics } from '@/lib/google/search-console'
import { isSearchConsoleConfigured } from '@/lib/queries/search-console'
import { format, subDays } from 'date-fns'

export type KeywordOpportunity = {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  score: number
  recommendation: string
  suggestedUrl: string | null
  suggestedTitle: string | null
}

export type KeywordGap = {
  query: string
  impressions: number
  clicks: number
  ctr: number
  position: number
  relatedPage: string | null
  score: number
  recommendation: string
  suggestedUrl: string | null
}

export type ContentIdea = {
  title: string
  sourceKeyword: string
  impressions: number
  suggestedUrl: string
  type: 'ARTICLE' | 'LANDING' | 'CATEGORY' | 'EVENT'
}

export type TopLocalQuery = {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  category: string
}

export type TopVenuePage = {
  page: string
  name: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type TopEventPage = {
  page: string
  name: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type TopBlogPage = {
  page: string
  name: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type TrendData = {
  query: string
  currentImpressions: number
  previousImpressions: number
  growth: number
}

export type SearchConsoleInsightsData = {
  keywordOpportunities: KeywordOpportunity[]
  keywordGaps: KeywordGap[]
  contentIdeas: ContentIdea[]
  topLocalQueries: TopLocalQuery[]
  topVenuePages: TopVenuePage[]
  topEventPages: TopEventPage[]
  topBlogPages: TopBlogPage[]
  trends: TrendData[]
  lastSyncDate: string | null
  totalKeywords: number
  totalOpportunities: number
  totalGaps: number
}

const LOCAL_CATEGORIES = [
  'restaurantes',
  'cafeterias',
  'hoteles',
  'eventos',
  'farmacias',
  'bares',
  'gimnasios',
  'bancos',
  'tiendas',
  'supermercados',
  'cines',
  'museos',
  'iglesias',
  'clinicas',
  'veterinarias',
  'gasolineras',
  'lavanderias',
  'floristerias',
  'heladerias',
  'pizzerias',
]

function calculateOpportunityScore(data: {
  impressions: number
  position: number
  ctr: number
}): number {
  const impressionScore = Math.min(data.impressions / 100, 1) * 50
  const positionScore = Math.max(0, (10 - data.position) / 10) * 30
  const ctrScore = Math.max(0, (0.05 - data.ctr) / 0.05) * 20
  return Math.round(impressionScore + positionScore + ctrScore)
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function generateRecommendation(
  query: string,
  hasExistingPage: boolean,
): {
  action: 'CREATE_LANDING' | 'OPTIMIZE_PAGE' | 'CREATE_CATEGORY' | 'CREATE_EVENT' | 'CREATE_ARTICLE'
  suggestedUrl: string | null
  suggestedTitle: string | null
} {
  const lowerQuery = query.toLowerCase()
  const slug = slugify(query)

  if (hasExistingPage) {
    return {
      action: 'OPTIMIZE_PAGE',
      suggestedUrl: null,
      suggestedTitle: null,
    }
  }

  if (lowerQuery.includes('evento') || lowerQuery.includes('concierto') || lowerQuery.includes('feria')) {
    return {
      action: 'CREATE_EVENT',
      suggestedUrl: `/eventos`,
      suggestedTitle: `Evento: ${query}`,
    }
  }

  const isCategory = LOCAL_CATEGORIES.some((cat) => lowerQuery.includes(cat))
  if (isCategory) {
    return {
      action: 'CREATE_LANDING',
      suggestedUrl: `/${slug}`,
      suggestedTitle: `${query} en Loja`,
    }
  }

  if (lowerQuery.includes('mejores') || lowerQuery.includes('top') || lowerQuery.includes('ranking')) {
    return {
      action: 'CREATE_ARTICLE',
      suggestedUrl: `/blog/${slug}`,
      suggestedTitle: query,
    }
  }

  return {
    action: 'CREATE_LANDING',
    suggestedUrl: `/${slug}`,
    suggestedTitle: `${query} en Loja`,
  }
}

function extractPageName(page: string): string {
  try {
    const url = new URL(page)
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length >= 2) {
      return parts[parts.length - 1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    }
    return parts[0] || page
  } catch {
    return page
  }
}

function categorizeQuery(query: string): string {
  const lower = query.toLowerCase()
  for (const cat of LOCAL_CATEGORIES) {
    if (lower.includes(cat)) return cat
  }
  return 'general'
}

export async function syncSearchConsoleSnapshots(
  startDate: Date,
  endDate: Date,
): Promise<{ keywords: number; pages: number; snapshot: boolean }> {
  if (!isSearchConsoleConfigured()) {
    throw new Error('Search Console no está configurado')
  }

  const start = format(startDate, 'yyyy-MM-dd')
  const end = format(endDate, 'yyyy-MM-dd')

  const [queriesData, pagesData, summaryData] = await Promise.all([
    getSearchAnalytics(undefined, start, end, ['query'], 1000),
    getSearchAnalytics(undefined, start, end, ['page'], 1000),
    getSearchAnalytics(undefined, start, end, [], 1),
  ])

  const snapshotDate = new Date(format(endDate, 'yyyy-MM-dd'))

  await prisma.searchConsoleSnapshot.upsert({
    where: { date: snapshotDate },
    update: {
      totalClicks: summaryData.rows.reduce((sum, r) => sum + r.clicks, 0),
      totalImpressions: summaryData.rows.reduce((sum, r) => sum + r.impressions, 0),
      averageCtr:
        summaryData.rows.length > 0
          ? summaryData.rows.reduce((sum, r) => sum + r.ctr, 0) / summaryData.rows.length
          : 0,
      averagePosition:
        summaryData.rows.length > 0
          ? summaryData.rows.reduce((sum, r) => sum + r.position, 0) / summaryData.rows.length
          : 0,
    },
    create: {
      date: snapshotDate,
      totalClicks: summaryData.rows.reduce((sum, r) => sum + r.clicks, 0),
      totalImpressions: summaryData.rows.reduce((sum, r) => sum + r.impressions, 0),
      averageCtr:
        summaryData.rows.length > 0
          ? summaryData.rows.reduce((sum, r) => sum + r.ctr, 0) / summaryData.rows.length
          : 0,
      averagePosition:
        summaryData.rows.length > 0
          ? summaryData.rows.reduce((sum, r) => sum + r.position, 0) / summaryData.rows.length
          : 0,
    },
  })

  let keywordCount = 0
  for (const row of queriesData.rows) {
    const query = row.keys[0]
    if (!query) continue
    await prisma.searchConsoleKeyword.upsert({
      where: { date_query: { date: snapshotDate, query } },
      update: {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      },
      create: {
        date: snapshotDate,
        query,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      },
    })
    keywordCount++
  }

  let pageCount = 0
  for (const row of pagesData.rows) {
    const page = row.keys[0]
    if (!page) continue
    await prisma.searchConsolePage.upsert({
      where: { date_page: { date: snapshotDate, page } },
      update: {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      },
      create: {
        date: snapshotDate,
        page,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      },
    })
    pageCount++
  }

  await detectAndStoreOpportunities(snapshotDate)

  return { keywords: keywordCount, pages: pageCount, snapshot: true }
}

async function detectAndStoreOpportunities(date: Date): Promise<void> {
  const keywords = await prisma.searchConsoleKeyword.findMany({
    where: { date },
    orderBy: { impressions: 'desc' },
  })

  const pages = await prisma.searchConsolePage.findMany({
    where: { date },
    select: { page: true },
  })

  const pageSlugs = new Set(
    pages.map((p) => {
      try {
        const url = new URL(p.page)
        return url.pathname
      } catch {
        return p.page
      }
    }),
  )

  const venueSlugs = await prisma.venue.findMany({
    where: { status: 'APPROVED' },
    select: { slug: true },
  })
  const venueSlugSet = new Set(venueSlugs.map((v) => `/locales/${v.slug}`))

  const eventSlugs = await prisma.event.findMany({
    where: { status: 'APPROVED' },
    select: { slug: true },
  })
  const eventSlugSet = new Set(eventSlugs.map((e) => `/eventos/${e.slug}`))

  const postSlugs = await prisma.post.findMany({
    where: { status: 'APPROVED' },
    select: { slug: true },
  })
  const postSlugSet = new Set(postSlugs.map((p) => `/blog/${p.slug}`))

  await prisma.searchConsoleOpportunity.deleteMany({
    where: {
      createdAt: {
        lt: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  })

  for (const kw of keywords) {
    if (kw.impressions < 10) continue

    const lowerQuery = kw.query.toLowerCase()
    let hasExistingPage = false
    for (const slug of pageSlugs) {
      if (slug.toLowerCase().includes(lowerQuery.replace(/\s+/g, '-'))) {
        hasExistingPage = true
        break
      }
    }
    for (const slug of venueSlugSet) {
      if (slug.toLowerCase().includes(lowerQuery.replace(/\s+/g, '-'))) {
        hasExistingPage = true
        break
      }
    }

    const score = calculateOpportunityScore({
      impressions: kw.impressions,
      position: kw.position,
      ctr: kw.ctr,
    })

    if (score < 15) continue

    let opportunityType = 'HIGH_IMPRESSIONS'
    if (kw.ctr < 0.03 && kw.impressions > 20) opportunityType = 'LOW_CTR'
    if (!hasExistingPage && kw.impressions > 10) opportunityType = 'KEYWORD_GAP'

    const rec = generateRecommendation(kw.query, hasExistingPage)

    await prisma.searchConsoleOpportunity.upsert({
      where: {
        id: (
          await prisma.searchConsoleOpportunity.findFirst({
            where: { query: kw.query, createdAt: { gte: new Date(date.getTime() - 24 * 60 * 60 * 1000) } },
            select: { id: true },
          })
        )?.id || '',
      },
      update: {
        score,
        impressions: kw.impressions,
        clicks: kw.clicks,
        ctr: kw.ctr,
        position: kw.position,
        opportunityType,
        recommendation: rec.action,
        suggestedUrl: rec.suggestedUrl,
        suggestedTitle: rec.suggestedTitle,
      },
      create: {
        query: kw.query,
        opportunityType,
        score,
        impressions: kw.impressions,
        clicks: kw.clicks,
        ctr: kw.ctr,
        position: kw.position,
        recommendation: rec.action,
        suggestedUrl: rec.suggestedUrl,
        suggestedTitle: rec.suggestedTitle,
      },
    })
  }
}

export async function getKeywordOpportunities(limit = 50): Promise<KeywordOpportunity[]> {
  const latestSnapshot = await prisma.searchConsoleSnapshot.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  })

  if (!latestSnapshot) return []

  const keywords = await prisma.searchConsoleKeyword.findMany({
    where: {
      date: latestSnapshot.date,
      impressions: { gt: 20 },
      ctr: { lt: 0.03 },
    },
    orderBy: { impressions: 'desc' },
    take: limit,
  })

  return keywords.map((kw) => ({
    query: kw.query,
    clicks: kw.clicks,
    impressions: kw.impressions,
    ctr: kw.ctr,
    position: Math.round(kw.position * 10) / 10,
    score: calculateOpportunityScore({
      impressions: kw.impressions,
      position: kw.position,
      ctr: kw.ctr,
    }),
    recommendation: kw.ctr < 0.02 ? 'Optimizar título y meta description' : 'Mejorar snippet',
    suggestedUrl: null,
    suggestedTitle: null,
  }))
}

export async function getLowCTRPages(limit = 50): Promise<
  Array<{
    page: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
> {
  const latestSnapshot = await prisma.searchConsoleSnapshot.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  })

  if (!latestSnapshot) return []

  return prisma.searchConsolePage.findMany({
    where: {
      date: latestSnapshot.date,
      impressions: { gt: 20 },
      ctr: { lt: 0.03 },
    },
    orderBy: { impressions: 'desc' },
    take: limit,
    select: {
      page: true,
      clicks: true,
      impressions: true,
      ctr: true,
      position: true,
    },
  })
}

export async function getTopLocalQueries(limit = 100): Promise<TopLocalQuery[]> {
  const latestSnapshot = await prisma.searchConsoleSnapshot.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  })

  if (!latestSnapshot) return []

  const keywords = await prisma.searchConsoleKeyword.findMany({
    where: { date: latestSnapshot.date },
    orderBy: { impressions: 'desc' },
    take: limit * 3,
  })

  const localQueries = keywords
    .filter((kw) => {
      const lower = kw.query.toLowerCase()
      return LOCAL_CATEGORIES.some((cat) => lower.includes(cat)) || lower.includes('loja')
    })
    .slice(0, limit)

  return localQueries.map((kw) => ({
    query: kw.query,
    clicks: kw.clicks,
    impressions: kw.impressions,
    ctr: Math.round(kw.ctr * 1000) / 1000,
    position: Math.round(kw.position * 10) / 10,
    category: categorizeQuery(kw.query),
  }))
}

export async function getTopVenuePages(limit = 50): Promise<TopVenuePage[]> {
  const latestSnapshot = await prisma.searchConsoleSnapshot.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  })

  if (!latestSnapshot) return []

  const pages = await prisma.searchConsolePage.findMany({
    where: {
      date: latestSnapshot.date,
      page: { contains: '/locales/' },
    },
    orderBy: { impressions: 'desc' },
    take: limit,
    select: {
      page: true,
      clicks: true,
      impressions: true,
      ctr: true,
      position: true,
    },
  })

  return pages.map((p) => ({
    page: p.page,
    name: extractPageName(p.page),
    clicks: p.clicks,
    impressions: p.impressions,
    ctr: Math.round(p.ctr * 1000) / 1000,
    position: Math.round(p.position * 10) / 10,
  }))
}

export async function getTopEventPages(limit = 50): Promise<TopEventPage[]> {
  const latestSnapshot = await prisma.searchConsoleSnapshot.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  })

  if (!latestSnapshot) return []

  const pages = await prisma.searchConsolePage.findMany({
    where: {
      date: latestSnapshot.date,
      page: { contains: '/eventos/' },
    },
    orderBy: { impressions: 'desc' },
    take: limit,
    select: {
      page: true,
      clicks: true,
      impressions: true,
      ctr: true,
      position: true,
    },
  })

  return pages.map((p) => ({
    page: p.page,
    name: extractPageName(p.page),
    clicks: p.clicks,
    impressions: p.impressions,
    ctr: Math.round(p.ctr * 1000) / 1000,
    position: Math.round(p.position * 10) / 10,
  }))
}

export async function getTopBlogPages(limit = 50): Promise<TopBlogPage[]> {
  const latestSnapshot = await prisma.searchConsoleSnapshot.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  })

  if (!latestSnapshot) return []

  const pages = await prisma.searchConsolePage.findMany({
    where: {
      date: latestSnapshot.date,
      page: { contains: '/blog/' },
    },
    orderBy: { impressions: 'desc' },
    take: limit,
    select: {
      page: true,
      clicks: true,
      impressions: true,
      ctr: true,
      position: true,
    },
  })

  return pages.map((p) => ({
    page: p.page,
    name: extractPageName(p.page),
    clicks: p.clicks,
    impressions: p.impressions,
    ctr: Math.round(p.ctr * 1000) / 1000,
    position: Math.round(p.position * 10) / 10,
  }))
}

export async function getContentIdeas(): Promise<ContentIdea[]> {
  const latestSnapshot = await prisma.searchConsoleSnapshot.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  })

  if (!latestSnapshot) return []

  const keywords = await prisma.searchConsoleKeyword.findMany({
    where: {
      date: latestSnapshot.date,
      impressions: { gt: 15 },
    },
    orderBy: { impressions: 'desc' },
    take: 200,
  })

  const ideas: ContentIdea[] = []
  const seen = new Set<string>()

  for (const kw of keywords) {
    const lower = kw.query.toLowerCase()
    const slug = slugify(kw.query)

    if (lower.includes('mejores') || lower.includes('top') || lower.includes('ranking')) {
      const title = `${kw.query} en Loja`
      if (!seen.has(title)) {
        seen.add(title)
        ideas.push({
          title,
          sourceKeyword: kw.query,
          impressions: kw.impressions,
          suggestedUrl: `/blog/${slug}`,
          type: 'ARTICLE',
        })
      }
    }

    if (lower.includes('que hacer') || lower.includes('qué hacer') || lower.includes('donde ir') || lower.includes('dónde ir')) {
      const title = `${kw.query} - Guía completa`
      if (!seen.has(title)) {
        seen.add(title)
        ideas.push({
          title,
          sourceKeyword: kw.query,
          impressions: kw.impressions,
          suggestedUrl: `/blog/${slug}`,
          type: 'ARTICLE',
        })
      }
    }

    const isCategory = LOCAL_CATEGORIES.some((cat) => lower.includes(cat))
    if (isCategory && !lower.includes('loja')) {
      const title = `${kw.query} en Loja`
      if (!seen.has(title)) {
        seen.add(title)
        ideas.push({
          title,
          sourceKeyword: kw.query,
          impressions: kw.impressions,
          suggestedUrl: `/${slug}`,
          type: 'LANDING',
        })
      }
    }
  }

  const categorySlugs = await prisma.category.findMany({
    where: { type: 'VENUE' },
    select: { slug: true, name: true },
  })
  const categorySlugSet = new Set(categorySlugs.map((c) => c.slug))

  for (const cat of LOCAL_CATEGORIES) {
    if (!categorySlugSet.has(cat)) {
      ideas.push({
        title: `Categoría: ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
        sourceKeyword: `${cat} loja`,
        impressions: 0,
        suggestedUrl: `/${cat}`,
        type: 'CATEGORY',
      })
    }
  }

  return ideas.slice(0, 30)
}

export async function detectKeywordGaps(): Promise<KeywordGap[]> {
  const latestSnapshot = await prisma.searchConsoleSnapshot.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  })

  if (!latestSnapshot) return []

  const keywords = await prisma.searchConsoleKeyword.findMany({
    where: {
      date: latestSnapshot.date,
      impressions: { gt: 10 },
    },
    orderBy: { impressions: 'desc' },
    take: 300,
  })

  const pages = await prisma.searchConsolePage.findMany({
    where: { date: latestSnapshot.date },
    select: { page: true },
  })

  const pagePaths = new Set(
    pages.map((p) => {
      try {
        return new URL(p.page).pathname
      } catch {
        return p.page
      }
    }),
  )

  const venueSlugs = await prisma.venue.findMany({
    where: { status: 'APPROVED' },
    select: { slug: true, name: true },
  })

  const eventSlugs = await prisma.event.findMany({
    where: { status: 'APPROVED' },
    select: { slug: true, title: true },
  })

  const gaps: KeywordGap[] = []

  for (const kw of keywords) {
    const lower = kw.query.toLowerCase()
    const slug = slugify(kw.query)

    let relatedPage: string | null = null
    for (const path of pagePaths) {
      if (path.toLowerCase().includes(slug) || slug.includes(path.toLowerCase().replace(/\//g, ''))) {
        relatedPage = path
        break
      }
    }

    for (const v of venueSlugs) {
      if (lower.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(lower)) {
        relatedPage = `/locales/${v.slug}`
        break
      }
    }

    for (const e of eventSlugs) {
      if (lower.includes(e.title.toLowerCase()) || e.title.toLowerCase().includes(lower)) {
        relatedPage = `/eventos/${e.slug}`
        break
      }
    }

    if (!relatedPage) {
      const rec = generateRecommendation(kw.query, false)
      const score = calculateOpportunityScore({
        impressions: kw.impressions,
        position: kw.position,
        ctr: kw.ctr,
      })

      gaps.push({
        query: kw.query,
        impressions: kw.impressions,
        clicks: kw.clicks,
        ctr: Math.round(kw.ctr * 1000) / 1000,
        position: Math.round(kw.position * 10) / 10,
        relatedPage: null,
        score,
        recommendation: rec.action,
        suggestedUrl: rec.suggestedUrl,
      })
    }
  }

  return gaps.sort((a, b) => b.score - a.score).slice(0, 50)
}

export async function getSearchConsoleTrends(): Promise<TrendData[]> {
  const snapshots = await prisma.searchConsoleSnapshot.findMany({
    orderBy: { date: 'desc' },
    take: 14,
    select: { date: true },
  })

  if (snapshots.length < 2) return []

  const latestDate = snapshots[0].date
  const previousDate = snapshots[Math.min(snapshots.length - 1, 6)].date

  const [currentKeywords, previousKeywords] = await Promise.all([
    prisma.searchConsoleKeyword.findMany({
      where: { date: latestDate },
      select: { query: true, impressions: true },
    }),
    prisma.searchConsoleKeyword.findMany({
      where: { date: previousDate },
      select: { query: true, impressions: true },
    }),
  ])

  const previousMap = new Map(previousKeywords.map((k) => [k.query, k.impressions]))

  const trends: TrendData[] = []

  for (const current of currentKeywords) {
    const previousImpressions = previousMap.get(current.query) ?? 0
    if (current.impressions < 5) continue

    const growth =
      previousImpressions > 0
        ? ((current.impressions - previousImpressions) / previousImpressions) * 100
        : current.impressions > 0
          ? 100
          : 0

    if (Math.abs(growth) > 20) {
      trends.push({
        query: current.query,
        currentImpressions: current.impressions,
        previousImpressions,
        growth: Math.round(growth),
      })
    }
  }

  return trends.sort((a, b) => Math.abs(b.growth) - Math.abs(a.growth)).slice(0, 30)
}

export async function getSearchConsoleInsights(): Promise<SearchConsoleInsightsData> {
  const lastSnapshot = await prisma.searchConsoleSnapshot.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  })

  const [
    keywordOpportunities,
    keywordGaps,
    contentIdeas,
    topLocalQueries,
    topVenuePages,
    topEventPages,
    topBlogPages,
    trends,
    totalKeywords,
    totalOpportunities,
    totalGaps,
  ] = await Promise.all([
    getKeywordOpportunities(),
    detectKeywordGaps(),
    getContentIdeas(),
    getTopLocalQueries(),
    getTopVenuePages(),
    getTopEventPages(),
    getTopBlogPages(),
    getSearchConsoleTrends(),
    prisma.searchConsoleKeyword
      .findFirst({
        where: lastSnapshot ? { date: lastSnapshot.date } : {},
        orderBy: { date: 'desc' },
        select: { id: true },
      })
      .then(() =>
        prisma.searchConsoleKeyword.count({
          where: lastSnapshot ? { date: lastSnapshot.date } : {},
        }),
      ),
    prisma.searchConsoleOpportunity.count({ where: { status: 'OPEN' } }),
    prisma.searchConsoleOpportunity.count({
      where: { opportunityType: 'KEYWORD_GAP', status: 'OPEN' },
    }),
  ])

  return {
    keywordOpportunities,
    keywordGaps,
    contentIdeas,
    topLocalQueries,
    topVenuePages,
    topEventPages,
    topBlogPages,
    trends,
    lastSyncDate: lastSnapshot?.date.toISOString() ?? null,
    totalKeywords,
    totalOpportunities,
    totalGaps,
  }
}
