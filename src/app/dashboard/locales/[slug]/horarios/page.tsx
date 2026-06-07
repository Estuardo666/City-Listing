import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BusinessHoursEditor } from '@/components/business-hours/business-hours-editor'

export const metadata = { title: 'Horarios — Dashboard' }

export default async function VenueHoursPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const { slug } = await params

  const venue = await prisma.venue.findFirst({
    where: { slug, userId: session.user.id },
    select: { id: true, name: true },
  })
  if (!venue) redirect('/dashboard/locales')

  const businessHours = await prisma.venueBusinessHours.findMany({
    where: { venueId: venue.id },
    orderBy: [{ dayOfWeek: 'asc' }, { openTime: 'asc' }],
  })

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{venue.name}</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Horarios de atención</h1>
          <p className="text-sm text-muted-foreground">
            Configura los horarios de tu local. Puedes agregar múltiples franjas horarias por día.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <BusinessHoursEditor venueId={venue.id} initialData={businessHours} />
        </div>
      </section>
    </div>
  )
}
