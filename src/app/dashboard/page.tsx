import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { Calendar, MapPin, FileText, PenLine, ArrowRight, Clock, CheckCircle2, BarChart3 } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserEngagementStats } from '@/lib/queries/engagement'
import { Button } from '@/components/ui/button'
import { EngagementStatsWidget } from '@/components/features/dashboard/engagement-stats'

export const metadata = {
  title: 'Dashboard — CityListing',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')

  const userId = session.user.id

  const [eventCount, venueCount, postStats, engagement] = await Promise.all([
    prisma.event.count({ where: { userId } }),
    prisma.venue.count({ where: { userId } }),
    prisma.post.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true },
    }),
    getUserEngagementStats(userId),
  ])

  const postApproved = postStats.find((s) => s.status === 'APPROVED')?._count.status ?? 0
  const postPending  = postStats.find((s) => s.status === 'PENDING')?._count.status ?? 0
  const postTotal    = postStats.reduce((acc, s) => acc + s._count.status, 0)

  const name = session.user.name?.split(' ')[0] ?? 'Usuario'

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">

        {/* Greeting */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Panel de control</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Hola, {name} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus eventos, locales y artículos del blog desde aquí.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Eventos</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{eventCount}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">creados</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium">Locales</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{venueCount}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">registrados</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Publicados</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-900">{postApproved}</p>
            <p className="mt-0.5 text-xs text-emerald-700">artículos</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">En revisión</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-900">{postPending}</p>
            <p className="mt-0.5 text-xs text-amber-700">artículos</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Acciones rápidas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/dashboard/eventos/crear"
              className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Calendar className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Crear evento</p>
                <p className="text-xs text-muted-foreground">Publica un nuevo evento</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/dashboard/locales/crear"
              className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-emerald/30 active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-subtle text-emerald-subtle-foreground">
                <MapPin className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Registrar local</p>
                <p className="text-xs text-muted-foreground">Añade tu negocio</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/dashboard/blog/crear"
              className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-coral/30 active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral-subtle text-coral-subtle-foreground">
                <PenLine className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Escribir artículo</p>
                <p className="text-xs text-muted-foreground">Publica en el blog</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Analytics shortcut */}
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Analytics</p>
              <p className="text-xs text-muted-foreground">
                Estadísticas y rendimiento de tu contenido
              </p>
            </div>
          </div>
          <Button asChild className="h-9 border border-border/80 bg-background text-foreground hover:bg-accent">
            <Link href="/dashboard/analytics">
              Ver <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Engagement stats */}
        <EngagementStatsWidget stats={engagement} />

        {/* Blog shortcut */}
        {postTotal > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-5 py-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">Mis artículos del blog</p>
                <p className="text-xs text-muted-foreground">
                  {postTotal} artículo{postTotal !== 1 ? 's' : ''} · {postApproved} publicado{postApproved !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button asChild className="h-9 border border-border/80 bg-background text-foreground hover:bg-accent">
              <Link href="/dashboard/blog">
                Gestionar <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}

      </section>
    </div>
  )
}
