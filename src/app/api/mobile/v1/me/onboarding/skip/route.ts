import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para continuar.', 401)

  await prisma.user.update({
    where: { id: principal.userId },
    data: { onboardingSkippedAt: new Date(), onboardingCompletedAt: null },
  })

  return mobileSuccess({ skipped: true })
}
