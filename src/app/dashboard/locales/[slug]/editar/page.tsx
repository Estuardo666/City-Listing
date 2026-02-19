import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { VenueEditForm } from '@/components/features/venues'
import { Button } from '@/components/ui/button'
import { getVenueBySlug, getVenueCategories } from '@/lib/queries/venues'

type VenueEditPageProps = {
  params: Promise<{ slug: string }>
}

export default async function DashboardVenueEditPage({ params }: VenueEditPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')

  const { slug } = await params
  const [venue, categories] = await Promise.all([
    getVenueBySlug(slug),
    getVenueCategories(),
  ])

  if (!venue) notFound()

  if (session.user.role !== 'ADMIN' && venue.user.id !== session.user.id) {
    redirect('/dashboard/locales')
  }

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6">

        <div className="flex items-center gap-4">
          <Button asChild className="h-9 border border-border/80 bg-background text-foreground hover:bg-accent">
            <Link href="/dashboard/locales">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Mis locales
            </Link>
          </Button>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Locales</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Editar local</h1>
          <p className="text-sm text-muted-foreground">
            Actualiza la información del local. Los cambios se reflejarán inmediatamente.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <VenueEditForm venue={venue} categories={categories} />
        </div>

      </section>
    </div>
  )
}
