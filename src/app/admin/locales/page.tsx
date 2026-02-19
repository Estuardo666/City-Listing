import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AdminVenueModeration } from '@/components/features/venues'
import { Button } from '@/components/ui/button'
import { getAdminVenues } from '@/lib/queries/venues'
import { adminVenueStatusFilterSchema, type AdminVenueStatusFilterInput } from '@/schemas/venue.schema'

type AdminLocalesPageProps = {
  searchParams: Promise<{
    status?: string | string[]
  }>
}

function getStatusParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export default async function AdminLocalesPage({ searchParams }: AdminLocalesPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const resolvedSearchParams = await searchParams
  const rawStatus = getStatusParam(resolvedSearchParams.status)

  const parsedStatus = adminVenueStatusFilterSchema.safeParse(
    rawStatus ? rawStatus.toUpperCase() : undefined
  )

  const selectedStatus: AdminVenueStatusFilterInput = parsedStatus.success
    ? parsedStatus.data
    : 'PENDING'

  const venues = await getAdminVenues(selectedStatus)

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="eyebrow">Panel de control</p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Moderación de locales pendientes
              </h1>
              <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
                Revisa locales enviados por la comunidad. Solo locales aprobados se publican en el directorio.
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

        <AdminVenueModeration venues={venues} selectedStatus={selectedStatus} />
      </section>
    </div>
  )
}
