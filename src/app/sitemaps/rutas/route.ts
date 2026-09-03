import 'server-only'
import { NextResponse } from 'next/server'

import { canonicalUrl } from '@/lib/canonical-urls'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const routes = await prisma.route.findMany({
    where: { status: 'APPROVED' },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 5000,
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${canonicalUrl('route', route.slug)}</loc>
    <lastmod>${route.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  })
}
