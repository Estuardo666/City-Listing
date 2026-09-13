import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/features/settings/profile-form'
import Link from 'next/link'
import { ArrowRight, SlidersHorizontal } from 'lucide-react'

export const metadata = { title: 'Configuración — Dashboard' }

export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: { select: { interests: true, lifestylePreferences: true } },
    },
  })

  if (!user) redirect('/auth/signin')

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-2xl space-y-8 px-4 sm:px-6">

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cuenta</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Administra tu cuenta y decide qué prioriza Vive Loja para ti.
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

        <section className="space-y-3" aria-labelledby="discovery-settings-title">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descubrimiento</p>
            <h2 id="discovery-settings-title" className="mt-1 text-lg font-semibold text-foreground">Preferencias del inicio</h2>
          </div>
          <Link
            href="/dashboard/intereses"
            className="group flex min-h-20 items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-[transform,border-color] duration-150 active:scale-[0.99] hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">Editar lo que quieres ver</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {user._count.interests} temas y {user._count.lifestylePreferences} preferencias influyen en tus recomendaciones.
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </section>

      </section>
    </div>
  )
}
