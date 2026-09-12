import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { getMyTicketOrders } from '@/lib/ticketing'

export const dynamic = 'force-dynamic'

export const GET = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus entradas.', 401)
  return mobileSuccess(await getMyTicketOrders(principal.userId))
})
