import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AdminVenueModeration } from '@/components/features/venues'
import { getAdminVenues, getVenueCategories } from '@/lib/queries/venues'
import { adminVenueStatusFilterSchema, type AdminVenueStatusFilterInput } from '@/schemas/venue.schema'

type AdminLocalesPageProps = {
  searchParams: Promise<{
    status?: string | string[]
    category?: string | string[]
    sort?: string | string[]
    q?: string | string[]
  }>
}

function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function AdminLocalesPage({ searchParams }: AdminLocalesPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const resolvedSearchParams = await searchParams
  const rawStatus = getParam(resolvedSearchParams.status)
  const category = getParam(resolvedSearchParams.category) ?? ''
  const sort = getParam(resolvedSearchParams.sort) ?? 'newest'
  const q = getParam(resolvedSearchParams.q) ?? ''

  const parsedStatus = adminVenueStatusFilterSchema.safeParse(
    rawStatus ? rawStatus.toUpperCase() : undefined
  )

  const selectedStatus: AdminVenueStatusFilterInput = parsedStatus.success
    ? parsedStatus.data
    : 'ALL'

  const [venues, categories] = await Promise.all([
    getAdminVenues({ status: selectedStatus, category, sort, q }),
    getVenueCategories(),
  ])

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-6">
        <AdminVenueModeration
          venues={venues}
          categories={categories}
          currentFilters={{ status: selectedStatus, category, sort, q }}
        />
      </section>
    </div>
  )
}
