import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/features/settings/profile-form'

export const metadata = { title: 'Configuración — Dashboard' }

export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) redirect('/auth/signin')

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-2xl space-y-8 px-4 sm:px-6">

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cuenta</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Actualiza tu nombre y contraseña de acceso.
          </p>
        </div>

        {/* Account info */}
        <div className="rounded-2xl border border-border/60 bg-card px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground">Cuenta</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{user.email}</p>
        </div>

        <ProfileForm
          currentName={user.name ?? ''}
          hasPassword={!!(user as any).password}
          currentImage={user.image}
        />

      </section>
    </div>
  )
}
