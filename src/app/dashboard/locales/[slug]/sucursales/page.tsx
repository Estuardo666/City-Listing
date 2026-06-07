import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BranchManager } from '@/components/branches/branch-manager'

export const metadata = {
  title: 'Sucursales — Dashboard',
}

export default async function VenueBranchesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const { slug } = await params

  const venue = await prisma.venue.findFirst({
    where: {
      slug,
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  })

  if (!venue) redirect('/dashboard/locales')

  const [branches, availableVenues, categories] = await Promise.all([
    prisma.venue.findMany({
      where: {
        parentId: venue.id,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            reservations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.venue.findMany({
      where: {
        userId: session.user.id,
        id: { not: venue.id },
        parentId: null,
      },
      select: {
        id: true,
        name: true,
        location: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: {
        type: 'VENUE',
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {venue.name}
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Gestión de Sucursales
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea, vincula y administra las sucursales de tu local.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <BranchManager
            parentVenueId={venue.id}
            branches={branches}
            availableVenues={availableVenues}
            categories={categories}
          />
        </div>
      </section>
    </div>
  )
}
