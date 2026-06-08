'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncSearchConsoleSnapshots } from '@/lib/seo/search-console-insights'
import { subDays } from 'date-fns'

export async function syncSearchConsoleAction(): Promise<{
  success: boolean
  message: string
  data?: { keywords: number; pages: number; snapshot: boolean }
}> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, message: 'No autorizado' }
  }

  try {
    const endDate = subDays(new Date(), 2)
    const startDate = subDays(endDate, 28)

    const result = await syncSearchConsoleSnapshots(startDate, endDate)

    return {
      success: true,
      message: `Sincronizado: ${result.keywords} keywords, ${result.pages} páginas`,
      data: result,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { success: false, message }
  }
}
