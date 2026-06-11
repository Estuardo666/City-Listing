import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WatchEventEditForm } from '@/components/features/watch-events/watch-event-edit-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AdminTransmisionEditPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const { id } = await params

  const [event, allVenues] = await Promise.all([
    prisma.watchEvent.findUnique({
      where: { id },
      include: {
        venues: {
          include: { venue: { select: { id: true, name: true, slug: true } } },
        },
      },
    }),
    prisma.venue.findMany({
      where: { status: 'APPROVED', isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!event) notFound()

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/transmisiones">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Transmisión</h1>
            <p className="text-muted-foreground text-sm mt-1">{event.name}</p>
          </div>
        </div>

        <WatchEventEditForm
          event={{
            ...event,
            description: event.description ?? null,
            image: event.image ?? null,
            matchTime: event.matchTime ?? null,
            competition: event.competition ?? null,
            performers: event.performers ?? null,
            venues: event.venues.map((v) => ({
              ...v,
              flyerUrl: v.flyerUrl ?? null,
              promotion: v.promotion ?? null,
            })),
          }}
          allVenues={allVenues}
        />
      </section>
    </div>
  )
}
