import 'server-only'
import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const SITE_URL = 'https://viveloja.com'
const PAGE_SIZE = 5000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const skip = (page - 1) * PAGE_SIZE

  const events = await prisma.watchEvent.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { matchDate: 'desc' },
    skip,
    take: PAGE_SIZE,
    select: { slug: true, updatedAt: true },
  })

  const entries: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${SITE_URL}/partidos/${e.slug}`,
    lastModified: e.updatedAt,
  }))

  const dondeVerEntries: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${SITE_URL}/donde-ver-${e.slug}-en-loja`,
    lastModified: e.updatedAt,
  }))

  return Response.json([...entries, ...dondeVerEntries])
}
