import 'server-only'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const SITE_URL = 'https://viveloja.com'

export async function GET() {
  const collections = await prisma.collection.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 5000,
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${collections.map(c => `  <url>
    <loc>${SITE_URL}/colecciones/${c.slug}</loc>
    <lastmod>${c.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  })
}
