import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { getAdminReviews, getAdminReviewStats, getReviewCategories } from '@/lib/queries/reviews'
import { adminReviewFiltersSchema } from '@/schemas/review.schema'
import { AdminReviewModeration } from '@/components/features/reviews/admin-review-moderation'

type AdminResenasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function AdminResenasPage({ searchParams }: AdminResenasPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const resolvedParams = await searchParams

  const filters = adminReviewFiltersSchema.parse({
    status: getParam(resolvedParams.status)?.toUpperCase() ?? 'ALL',
    entityType: getParam(resolvedParams.entityType)?.toUpperCase() ?? 'ALL',
    rating: getParam(resolvedParams.rating) ? Number(getParam(resolvedParams.rating)) : undefined,
    category: getParam(resolvedParams.category) ?? '',
    search: getParam(resolvedParams.search) ?? '',
    flagged: getParam(resolvedParams.flagged) === 'true',
    sort: getParam(resolvedParams.sort) ?? 'newest',
  })

  const [reviews, stats, categories] = await Promise.all([
    getAdminReviews(filters),
    getAdminReviewStats(),
    getReviewCategories(),
  ])

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="eyebrow">Panel de control</p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Moderación de reseñas
              </h1>
              <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
                Revisa, aprueba o rechaza reseñas de la comunidad. Filtra por calificación, categoría o posible spam.
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

        <AdminReviewModeration
          reviews={reviews}
          stats={stats}
          categories={categories}
          currentFilters={filters}
        />
      </section>
    </div>
  )
}
