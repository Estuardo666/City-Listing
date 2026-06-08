import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { VenueEditForm } from '@/components/features/venues/venue-edit-form'
import { getVenueCategories } from '@/lib/queries/venues'
import { prisma } from '@/lib/prisma'

type AdminEditarVenuePageProps = {
  params: Promise<{
    id: string
  }>
}

async function getVenueById(id: string) {
  return prisma.venue.findFirst({
    where: { id },
    include: {
      venueCategories: { include: { category: true } },
      venueSubcategories: { include: { subcategory: true } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      events: {
        where: {
          status: 'APPROVED',
        },
        orderBy: {
          startDate: 'asc',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          location: true,
          address: true,
        },
      },
      media: { orderBy: { order: 'asc' } },
      operatingHours: true,
      businessHours: {
        orderBy: [{ dayOfWeek: 'asc' }, { openTime: 'asc' }],
      },
      services: {
        orderBy: { sortOrder: 'asc' },
      },
      products: {
        orderBy: { order: 'asc' },
      },
      reviews: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
      },
      promotions: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } },
      reservationSettings: true,
    },
  })
}

export default async function AdminEditarVenuePage({ params }: AdminEditarVenuePageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { id } = await params
  const [venue, categories] = await Promise.all([
    getVenueById(id),
    getVenueCategories(),
  ])

  if (!venue) {
    notFound()
  }

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="space-y-3">
            <p className="eyebrow">Administración</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Editar local
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
              Editando: <span className="font-medium">{venue.name}</span>
            </p>
          </div>
        </div>

        <VenueEditForm venue={venue} categories={categories} />
      </section>
    </div>
  )
}
