import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileSuccess, mobileError, withMobileErrors } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'
export const GET = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión.', 401)
  return mobileSuccess(await prisma.eventUpdateNotice.findMany({ where: { userId: principal.userId },
    orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, title: true, body: true, slug: true, createdAt: true } }))
})
