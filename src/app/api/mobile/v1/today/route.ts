import { getTodayInLoja } from '@/lib/today'
import { mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
export const dynamic = 'force-dynamic'
export const GET = withMobileErrors(async () => {
  const response = mobileSuccess(await getTodayInLoja())
  response.headers.set('Cache-Control', 'no-store')
  return response
})
