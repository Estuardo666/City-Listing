import { subDays } from 'date-fns'
import { syncSearchConsoleSnapshots } from '@/lib/seo/search-console-insights'
import { isSearchConsoleConfigured } from '@/lib/queries/search-console'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Stores a rolling Search Console snapshot for the admin SEO dashboard.
 * Vercel calls this endpoint weekly; the two-day lag follows Google's data
 * availability window and matches the manual admin sync.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json({ error: 'CRON_SECRET no configurado' }, { status: 503 })
  }

  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!isSearchConsoleConfigured()) {
    return Response.json(
      { error: 'Search Console no configurado; se omite la sincronización' },
      { status: 503 },
    )
  }

  const endDate = subDays(new Date(), 2)
  const startDate = subDays(endDate, 28)

  try {
    const result = await syncSearchConsoleSnapshots(startDate, endDate)
    return Response.json({
      success: true,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      data: result,
    })
  } catch (error) {
    console.error('Search Console cron sync failed:', error)
    return Response.json({ error: 'No se pudo sincronizar Search Console' }, { status: 502 })
  }
}
