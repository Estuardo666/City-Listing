import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { VenueWizard } from '@/components/features/venues/venue-wizard'
import { getVenueCategories } from '@/lib/queries/venues'

export default async function DashboardCreateVenuePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const categories = await getVenueCategories()

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:max-w-4xl">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="mb-8 space-y-4">
            <p className="eyebrow">Registrar local</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Publica tu local en Vive Loja
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Registra tu negocio paso a paso. Podrás configurar la información básica, horarios, servicios y menú en un solo flujo.
            </p>
          </div>

          <VenueWizard categories={categories} />
        </div>
      </section>
    </div>
  )
}
