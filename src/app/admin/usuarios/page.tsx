import Link from 'next/link'
import { ShieldCheck, Users } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { getAdminUsers, getAdminUserStats, type AdminUserFilters } from '@/lib/queries/users'
import { AdminUsersList } from '@/components/features/admin/admin-users-list'

type AdminUsuariosPageProps = {
  searchParams: Promise<{
    q?: string | string[]
    role?: string | string[]
    sort?: string | string[]
  }>
}

function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function AdminUsuariosPage({ searchParams }: AdminUsuariosPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const resolvedSearchParams = await searchParams
  const q = getParam(resolvedSearchParams.q) ?? ''
  const role = getParam(resolvedSearchParams.role) ?? 'ALL'
  const sort = getParam(resolvedSearchParams.sort) ?? 'newest'

  const filters: AdminUserFilters = { q, role, sort }
  const [users, stats] = await Promise.all([
    getAdminUsers(filters),
    getAdminUserStats(),
  ])

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="eyebrow">Panel de control</p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Gestión de usuarios
              </h1>
              <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
                Administra los usuarios registrados en la plataforma.
              </p>
            </div>

            <Button asChild className="h-11 border border-border/80 bg-background text-foreground hover:bg-accent">
              <Link href="/dashboard">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Volver al dashboard
              </Link>
            </Button>
          </div>
        </div>

        <AdminUsersList users={users} stats={stats} currentFilters={{ q, role, sort }} />
      </section>
    </div>
  )
}
