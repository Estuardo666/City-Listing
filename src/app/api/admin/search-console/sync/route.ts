import { NextResponse } from 'next/server'
import { requireAdmin, unauthorized } from '@/lib/api/require-admin'
import { syncSearchConsoleSnapshots } from '@/lib/seo/search-console-insights'
import { subDays } from 'date-fns'

export async function POST() {
  const session = await requireAdmin()
  if (!session) return unauthorized()

  try {
    const endDate = subDays(new Date(), 2)
    const startDate = subDays(endDate, 28)

    const result = await syncSearchConsoleSnapshots(startDate, endDate)

    return NextResponse.json({
      success: true,
      message: `Sincronizado: ${result.keywords} keywords, ${result.pages} páginas`,
      data: result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
