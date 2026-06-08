import 'server-only'
import { NextResponse } from 'next/server'

const SITE_URL = 'https://viveloja.com'

export async function GET() {
  const urls = [
    { loc: SITE_URL, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/explorar`, priority: '0.9', changefreq: 'daily' },
    { loc: `${SITE_URL}/eventos`, priority: '0.8', changefreq: 'daily' },
    { loc: `${SITE_URL}/locales`, priority: '0.8', changefreq: 'daily' },
    { loc: `${SITE_URL}/blog`, priority: '0.7', changefreq: 'weekly' },
    { loc: `${SITE_URL}/ofertas`, priority: '0.7', changefreq: 'daily' },
    { loc: `${SITE_URL}/rutas`, priority: '0.6', changefreq: 'weekly' },
    { loc: `${SITE_URL}/colecciones`, priority: '0.6', changefreq: 'weekly' },
    { loc: `${SITE_URL}/about`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/contact`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/privacy`, priority: '0.3', changefreq: 'yearly' },
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  })
}
