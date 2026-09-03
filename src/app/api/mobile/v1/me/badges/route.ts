import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus insignias.', 401)

  const badges = await prisma.userBadge.findMany({
    where: { userId: principal.userId },
    orderBy: { earnedAt: 'desc' },
    select: { id: true, badgeType: true, name: true, description: true, icon: true, earnedAt: true },
  })
  return mobileSuccess(badges)
}
