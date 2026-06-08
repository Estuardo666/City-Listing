import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { EventWizard } from '@/components/features/events/event-wizard'
import { getEventCategories } from '@/lib/queries/events'
import { getApprovedVenuesForEventForm } from '@/lib/queries/venues'

export default async function DashboardCreateEventPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const [categories, venues] = await Promise.all([
    getEventCategories(),
    getApprovedVenuesForEventForm(),
  ])

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="mb-8 space-y-4">
            <p className="eyebrow">Crear nuevo evento</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Publica tu evento en Loja
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Crea tu evento paso a paso. Configura la información, fechas y ubicación en un solo flujo.
            </p>
          </div>

          <EventWizard categories={categories} venues={venues} />
        </div>
      </section>
    </div>
  )
}
