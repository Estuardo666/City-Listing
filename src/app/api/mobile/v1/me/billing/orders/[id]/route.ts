import { getBusinessAccountForUser } from '@/lib/billing/plans'
import { serializeOrder } from '@/lib/billing/service'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

export const GET = withMobileErrors(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para consultar la orden.', 401)
  const account = await getBusinessAccountForUser(principal.userId)
  if (!account) return mobileError('NOT_FOUND', 'Orden no encontrada.', 404)
  const { id } = await params
  const order = await prisma.order.findFirst({
    where: { id, accountId: account.id },
    include: { planVersion: { include: { plan: { select: { slug: true, name: true } } } }, addonProduct: { select: { slug: true, name: true } } },
  })
  if (!order) return mobileError('NOT_FOUND', 'Orden no encontrada.', 404)
  return mobileSuccess(serializeOrder(order))
})
