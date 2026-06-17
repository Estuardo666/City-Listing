import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOnboardingVenueCategories, getRecommendedVenuesForOnboarding, getUserInterests, getUserLifestylePreferences, getUserFollowingVenues } from '@/lib/queries/onboarding'
import { InteresesClient } from './intereses-client'

export const metadata = {
  title: 'Mis Intereses — Vive Loja',
}

export default async function InteresesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')

  const userId = session.user.id

  const [categories, venues, userInterests, userPreferences, userFollowing] = await Promise.all([
    getOnboardingVenueCategories(),
    getRecommendedVenuesForOnboarding(10),
    getUserInterests(userId),
    getUserLifestylePreferences(userId),
    getUserFollowingVenues(userId),
  ])

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personalización</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Mis Intereses
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus preferencias para recibir mejores recomendaciones.
          </p>
        </div>

        <InteresesClient
          categories={categories}
          venues={venues}
          initialInterests={userInterests.map((i) => i.categoryId)}
          initialPreferences={userPreferences.map((p) => p.preference)}
          initialFollowing={userFollowing.map((fv) => fv.venueId)}
        />
      </section>
    </div>
  )
}
