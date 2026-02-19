import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { PenLine, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { UserPostsList } from '@/components/features/blog/user-posts-list'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'Mis Artículos — Dashboard',
}

export default async function DashboardBlogPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')

  const [total, approved, pending, rejected] = await Promise.all([
    prisma.post.count({ where: { userId: session.user.id } }),
    prisma.post.count({ where: { userId: session.user.id, status: 'APPROVED' } }),
    prisma.post.count({ where: { userId: session.user.id, status: 'PENDING' } }),
    prisma.post.count({ where: { userId: session.user.id, status: 'REJECTED' } }),
  ])

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blog</p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Mis artículos</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los artículos que has enviado al blog de CityListing.
            </p>
          </div>
          <Button asChild className="h-10 shrink-0">
            <Link href="/dashboard/blog/crear">
              <PenLine className="mr-2 h-4 w-4" />
              Escribir artículo
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium">Total</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Publicados</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-900">{approved}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">En revisión</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-900">{pending}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center gap-2 text-rose-700">
              <XCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Rechazados</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-900">{rejected}</p>
          </div>
        </div>

        {/* Info banner for pending */}
        {pending > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Tienes <strong>{pending} artículo{pending > 1 ? 's' : ''}</strong> esperando revisión.
              El equipo los revisará en las próximas 24–48 horas.
            </p>
          </div>
        )}

        {/* Posts list */}
        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card px-6 py-14 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Aún no has escrito ningún artículo.</p>
            <Button asChild className="mt-4 h-9">
              <Link href="/dashboard/blog/crear">
                <PenLine className="mr-2 h-4 w-4" />
                Escribir mi primer artículo
              </Link>
            </Button>
          </div>
        ) : (
          <UserPostsList />
        )}

      </section>
    </div>
  )
}
