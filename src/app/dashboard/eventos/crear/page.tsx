import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { EventForm } from '@/components/features/events/event-form'
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
              Comparte tu evento con la comunidad. Todos los eventos son revisados antes de ser publicados.
            </p>
          </div>

          <EventForm categories={categories} venues={venues} />
        </div>
      </section>
    </div>
  )
}
