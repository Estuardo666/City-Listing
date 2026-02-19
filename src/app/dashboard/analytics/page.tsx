import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAuthorAnalytics } from '@/lib/queries/analytics'
import { AnalyticsDashboard } from '@/components/features/dashboard/analytics-dashboard'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Analytics — Dashboard',
  description: 'Estadísticas y rendimiento de tu contenido en CityListing.',
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const analytics = await getAuthorAnalytics(session.user.id)

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="mt-2 text-muted-foreground">
            Estadísticas detalladas del rendimiento de tu contenido
          </p>
        </div>

        <AnalyticsDashboard analytics={analytics} />
      </div>
    </div>
  )
}
