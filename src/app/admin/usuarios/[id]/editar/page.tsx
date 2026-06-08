import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAdminUserById } from '@/lib/queries/users'
import { AdminUserEditForm } from '@/components/features/admin/admin-user-edit-form'

type AdminEditarUsuarioPageProps = {
  params: Promise<{ id: string }>
}

export default async function AdminEditarUsuarioPage({ params }: AdminEditarUsuarioPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const { id } = await params
  const user = await getAdminUserById(id)

  if (!user) notFound()

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="space-y-3">
            <p className="eyebrow">Administración</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Editar usuario
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
              Editando: <span className="font-medium">{user.name ?? user.email}</span>
            </p>
          </div>
        </div>

        <AdminUserEditForm user={user} currentUserId={session.user.id} />
      </section>
    </div>
  )
}
