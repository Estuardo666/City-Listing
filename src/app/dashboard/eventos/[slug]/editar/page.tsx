import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { EventEditForm } from '@/components/features/events'
import { Button } from '@/components/ui/button'
import { getEventBySlug, getEventCategories } from '@/lib/queries/events'
import { getApprovedVenuesForEventForm } from '@/lib/queries/venues'

type EventEditPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function DashboardEventEditPage({ params }: EventEditPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { slug } = await params
  const [event, categories, venues] = await Promise.all([
    getEventBySlug(slug),
    getEventCategories(),
    getApprovedVenuesForEventForm(),
  ])

  if (!event) {
    notFound()
  }

  // Only admin or event owner can edit
  if (session.user.role !== 'ADMIN' && event.user.id !== session.user.id) {
    redirect('/dashboard/eventos')
  }

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            asChild
            className="h-9 border border-border/80 bg-background text-foreground hover:bg-accent"
          >
            <Link href="/dashboard/eventos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Mis eventos
            </Link>
          </Button>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eventos</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Editar evento
          </h1>
          <p className="text-sm text-muted-foreground">
            Actualiza la información del evento. Los cambios se reflejarán inmediatamente.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <EventEditForm event={event} categories={categories} venues={venues} />
        </div>

      </section>
    </div>
  )
}
