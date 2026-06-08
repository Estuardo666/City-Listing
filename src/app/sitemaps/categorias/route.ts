import 'server-only'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const SITE_URL = 'https://viveloja.com'

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { type: 'VENUE' },
    select: { slug: true, updatedAt: true },
    orderBy: { name: 'asc' },
  })

  const urls = categories.flatMap(c => [
    { loc: `${SITE_URL}/${c.slug}`, lastmod: c.updatedAt, priority: '0.8' },
    { loc: `${SITE_URL}/mejores/${c.slug}`, lastmod: c.updatedAt, priority: '0.7' },
  ])

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  })
}
