import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { Plus, Store } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { UserVenuesList } from '@/components/features/dashboard/user-venues-list'

export const metadata = { title: 'Mis Locales — Dashboard' }


export default async function DashboardLocalesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const [total, approved, pending] = await Promise.all([
    prisma.venue.count({ where: { userId: session.user.id } }),
    prisma.venue.count({ where: { userId: session.user.id, status: 'APPROVED' } }),
    prisma.venue.count({ where: { userId: session.user.id, status: 'PENDING' } }),
  ])

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Locales</p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Mis locales</h1>
            <p className="text-sm text-muted-foreground">Gestiona los locales que has registrado.</p>
          </div>
          <Button asChild className="h-10 shrink-0">
            <Link href="/dashboard/locales/crear">
              <Plus className="mr-2 h-4 w-4" />
              Registrar local
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Total</p>
            <p className="mt-1.5 text-2xl font-bold text-foreground">{total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-medium text-emerald-700">Publicados</p>
            <p className="mt-1.5 text-2xl font-bold text-emerald-900">{approved}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-medium text-amber-700">En revisión</p>
            <p className="mt-1.5 text-2xl font-bold text-amber-900">{pending}</p>
          </div>
        </div>

        {/* List */}
        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card px-6 py-14 text-center">
            <Store className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Aún no has registrado ningún local.</p>
            <Button asChild className="mt-4 h-9">
              <Link href="/dashboard/locales/crear">
                <Plus className="mr-2 h-4 w-4" />
                Registrar mi primer local
              </Link>
            </Button>
          </div>
        ) : (
          <UserVenuesList />
        )}
      </section>
    </div>
  )
}
