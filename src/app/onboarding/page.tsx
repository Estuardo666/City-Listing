import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOnboardingVenueCategories, getRecommendedVenuesForOnboarding } from '@/lib/queries/onboarding'
import { OnboardingClient } from './onboarding-client'

export const metadata = {
  title: 'Onboarding — Vive Loja',
}

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')

  if (session.user.onboardingCompleted) redirect('/dashboard')
  if (session.user.onboardingSkipped) redirect('/dashboard')

  const [categories, venues] = await Promise.all([
    getOnboardingVenueCategories(),
    getRecommendedVenuesForOnboarding(10),
  ])

  return (
    <OnboardingClient
      categories={categories}
      venues={venues}
      userName={session.user.name ?? null}
    />
  )
}
