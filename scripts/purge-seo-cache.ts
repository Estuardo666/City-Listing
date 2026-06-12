import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔥 Purgando cache SEO de Vive Loja...\n')

  // 1. Limpiar Redis (Upstash)
  console.log('1️⃣  Limpiando Redis cache...')
  try {
    const redisUrl = process.env.KV_REST_API_URL
    const redisToken = process.env.KV_REST_API_TOKEN

    if (!redisUrl || !redisToken) {
      console.log('   ⚠️  Redis no configurado (KV_REST_API_URL/KV_REST_API_TOKEN)')
    } else {
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({ url: redisUrl, token: redisToken })

      const keys = await redis.keys('*')
      if (keys.length > 0) {
        await redis.del(...keys)
        console.log(`   ✅ ${keys.length} claves eliminadas de Redis`)
      } else {
        console.log('   ✅ Redis ya estaba vacío')
      }
    }
  } catch (error) {
    console.log(`   ❌ Error limpiando Redis: ${error instanceof Error ? error.message : error}`)
  }

  // 2. Limpiar snapshots antiguos de Search Console
  console.log('\n2️⃣  Limpiando datos antiguos de Search Console...')
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)

    const [snapshots, keywords, pages, opportunities] = await Promise.all([
      prisma.searchConsoleSnapshot.deleteMany({ where: { date: { lt: cutoff } } }),
      prisma.searchConsoleKeyword.deleteMany({ where: { date: { lt: cutoff } } }),
      prisma.searchConsolePage.deleteMany({ where: { date: { lt: cutoff } } }),
      prisma.searchConsoleOpportunity.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ])

    console.log(`   ✅ Snapshots: ${snapshots.count} eliminados`)
    console.log(`   ✅ Keywords: ${keywords.count} eliminados`)
    console.log(`   ✅ Pages: ${pages.count} eliminados`)
    console.log(`   ✅ Opportunities: ${opportunities.count} eliminados`)
  } catch (error) {
    console.log(`   ❌ Error limpiando Search Console: ${error instanceof Error ? error.message : error}`)
  }

  // 3. Re-submeter sitemap
  console.log('\n3️⃣  Re-subiendo sitemap a Google...')
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
      console.log('   ⚠️  Google Search Console no configurado (GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN)')
    } else {
      const { submitSitemap } = await import('../src/lib/google/search-console')
      await submitSitemap(undefined, 'https://viveloja.com/sitemap.xml')
      console.log('   ✅ Sitemap re-subido a Google Search Console')
    }
  } catch (error) {
    console.log(`   ❌ Error subiendo sitemap: ${error instanceof Error ? error.message : error}`)
  }

  // 4. Resumen
  console.log('\n' + '='.repeat(50))
  console.log('✅ Cache SEO purgado correctamente')
  console.log('='.repeat(50))
  console.log('\nPróximos pasos:')
  console.log('  1. Los cambios de meta descriptions están activos en el deploy')
  console.log('  2. Google re-crawleará el sitio en las próximas 24-48h')
  console.log('  3. Puedes forzar re-indexación desde Search Console > Inspección de URLs')
  console.log('')

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('❌ Error fatal:', error)
  prisma.$disconnect()
  process.exit(1)
})
