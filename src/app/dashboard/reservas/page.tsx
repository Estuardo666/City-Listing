import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export const metadata = {
  title: 'Mis Reservas - Vive Loja',
}

export default async function MyReservationsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    include: {
      venue: { select: { name: true, slug: true } },
      event: { select: { title: true, slug: true } },
    },
  })

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    CONFIRMED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    NO_SHOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  }

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Completada',
    NO_SHOW: 'No asistió',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Mis Reservas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona tus reservas en locales y eventos
        </p>
      </div>

      {reservations.length > 0 ? (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">
                  {r.venue?.name ?? r.event?.title ?? 'Reserva'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(r.date)} a las {r.time} · {r.partySize} {r.partySize === 1 ? 'persona' : 'personas'}
                </p>
              </div>
              <span className={`shrink-0 ml-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[r.status] ?? ''}`}>
                {statusLabels[r.status] ?? r.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-muted-foreground">No tienes reservas</p>
          <p className="mt-1 text-sm text-muted-foreground">Reserva en un local o evento para verlas aquí</p>
        </div>
      )}
    </div>
  )
}
