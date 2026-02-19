import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { VenueForm } from '@/components/features/venues'
import { getVenueCategories } from '@/lib/queries/venues'

export default async function DashboardCreateVenuePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const categories = await getVenueCategories()

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="mb-8 space-y-4">
            <p className="eyebrow">Registrar local</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Publica tu local en CityListing Loja
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Registra tu negocio y llega a más personas. Todos los locales son revisados antes de publicarse.
            </p>
          </div>

          <VenueForm categories={categories} />
        </div>
      </section>
    </div>
  )
}
