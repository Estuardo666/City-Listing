import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AdminEventModeration } from '@/components/features/events'
import { getAdminEvents, getEventCategories } from '@/lib/queries/events'
import { adminEventStatusFilterSchema, type AdminEventStatusFilterInput } from '@/schemas/event.schema'

type AdminEventosPageProps = {
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

export default async function AdminEventosPage({ searchParams }: AdminEventosPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const resolvedSearchParams = await searchParams
  const rawStatus = getParam(resolvedSearchParams.status)
  const category = getParam(resolvedSearchParams.category) ?? ''
  const sort = getParam(resolvedSearchParams.sort) ?? 'newest'
  const q = getParam(resolvedSearchParams.q) ?? ''

  const parsedStatus = adminEventStatusFilterSchema.safeParse(
    rawStatus ? rawStatus.toUpperCase() : undefined
  )

  const selectedStatus: AdminEventStatusFilterInput = parsedStatus.success
    ? parsedStatus.data
    : 'ALL'

  const [events, categories] = await Promise.all([
    getAdminEvents({ status: selectedStatus, category, sort, q }),
    getEventCategories(),
  ])

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-6">
        <AdminEventModeration
          events={events}
          categories={categories}
          currentFilters={{ status: selectedStatus, category, sort, q }}
        />
      </section>
    </div>
  )
}
