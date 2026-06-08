import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EventEditForm } from '@/components/features/events/event-edit-form'
import { getEventCategories } from '@/lib/queries/events'
import { getApprovedVenuesForEventForm } from '@/lib/queries/venues'
import { prisma } from '@/lib/prisma'

type AdminEditarEventoPageProps = {
  params: Promise<{
    id: string
  }>
}

async function getEventById(id: string) {
  return prisma.event.findFirst({
    where: { id },
    include: {
      eventCategories: { include: { category: true } },
      eventSubcategories: { include: { subcategory: true } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      venue: true,
      media: { orderBy: { order: 'asc' } },
      reviews: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
      },
      recurrenceRule: true,
    },
  })
}

export default async function AdminEditarEventoPage({ params }: AdminEditarEventoPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { id } = await params
  const [event, categories, venues] = await Promise.all([
    getEventById(id),
    getEventCategories(),
    getApprovedVenuesForEventForm(),
  ])

  if (!event) {
    notFound()
  }

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="space-y-3">
            <p className="eyebrow">Administración</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Editar evento
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
              Editando: <span className="font-medium">{event.title}</span>
            </p>
          </div>
        </div>

        <EventEditForm event={event} categories={categories.map(c => ({ category: c }))} venues={venues} />
      </section>
    </div>
  )
}
