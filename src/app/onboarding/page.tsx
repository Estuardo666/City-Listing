import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOnboardingVenueCategories, getRecommendedVenuesForOnboarding } from '@/lib/queries/onboarding'
import { OnboardingClient } from './onboarding-client'

export const metadata = {
  title: 'Onboarding — Vive Loja',
  robots: { index: false, follow: false },
}

function safeReturnTo(value: string | undefined) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const returnTo = safeReturnTo((await searchParams).returnTo)
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')

  if (session.user.onboardingCompleted) redirect(returnTo ?? '/dashboard')
  if (session.user.onboardingSkipped) redirect(returnTo ?? '/dashboard')

  const [categories, venues] = await Promise.all([
    getOnboardingVenueCategories(),
    getRecommendedVenuesForOnboarding(10),
  ])

  return (
    <OnboardingClient
      categories={categories}
      venues={venues}
      userName={session.user.name ?? null}
      returnTo={returnTo}
    />
  )
}
