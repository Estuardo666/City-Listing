import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { getPublicTicketOrder } from '@/lib/ticketing'

export const dynamic = 'force-dynamic'

function isSafeToken(value: string) {
  return /^[A-Za-z0-9_-]{20,160}$/.test(value)
}

export const GET = withMobileErrors(async (_request: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params
  if (!isSafeToken(token)) return mobileError('INVALID_INPUT', 'El enlace de entradas no es válido.', 400)
  const response = mobileSuccess(await getPublicTicketOrder(token))
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return response
})
