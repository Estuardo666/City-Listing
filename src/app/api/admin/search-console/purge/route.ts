import { NextResponse } from 'next/server'
import { requireAdmin, unauthorized } from '@/lib/api/require-admin'
import { invalidateAllCache } from '@/lib/cache-invalidation'
import { prisma } from '@/lib/prisma'
import { submitSitemap } from '@/lib/google/search-console'

export async function POST() {
  const session = await requireAdmin()
  if (!session) return unauthorized()

  const results: {
    redis: boolean
    searchConsoleSnapshots: number
    searchConsoleKeywords: number
    searchConsolePages: number
    searchConsoleOpportunities: number
    sitemapSubmitted: boolean
  } = {
    redis: false,
    searchConsoleSnapshots: 0,
    searchConsoleKeywords: 0,
    searchConsolePages: 0,
    searchConsoleOpportunities: 0,
    sitemapSubmitted: false,
  }

  // 1. Limpiar Redis cache
  try {
    await invalidateAllCache()
    results.redis = true
  } catch (error) {
    console.error('Error clearing Redis cache:', error)
  }

  // 2. Limpiar snapshots de Search Console (más de 7 días)
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)

    const [snapshots, keywords, pages, opportunities] = await Promise.all([
      prisma.searchConsoleSnapshot.deleteMany({
        where: { date: { lt: cutoff } },
      }),
      prisma.searchConsoleKeyword.deleteMany({
        where: { date: { lt: cutoff } },
      }),
      prisma.searchConsolePage.deleteMany({
        where: { date: { lt: cutoff } },
      }),
      prisma.searchConsoleOpportunity.deleteMany({
        where: {
          createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    results.searchConsoleSnapshots = snapshots.count
    results.searchConsoleKeywords = keywords.count
    results.searchConsolePages = pages.count
    results.searchConsoleOpportunities = opportunities.count
  } catch (error) {
    console.error('Error clearing Search Console data:', error)
  }

  // 3. Re-submeter sitemap a Google para forzar re-crawl
  try {
    await submitSitemap(undefined, 'https://viveloja.com/sitemap.xml')
    results.sitemapSubmitted = true
  } catch (error) {
    console.error('Error submitting sitemap:', error)
  }

  return NextResponse.json({
    success: true,
    message: 'Cache SEO purgado correctamente',
    data: results,
  })
}
