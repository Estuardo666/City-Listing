import 'server-only'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const SITE_URL = 'https://viveloja.com'
const PAGE_SIZE = 5000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const skip = (page - 1) * PAGE_SIZE

  const venues = await prisma.venue.findMany({
    where: { status: 'APPROVED', isActive: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    skip,
    take: PAGE_SIZE,
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${venues.map(v => `  <url>
    <loc>${SITE_URL}/locales/${v.slug}</loc>
    <lastmod>${v.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  })
}
