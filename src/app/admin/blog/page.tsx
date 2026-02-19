import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AdminBlogModeration } from '@/components/features/blog'
import { Button } from '@/components/ui/button'
import { getAdminPosts } from '@/lib/queries/posts'
import { adminPostStatusFilterSchema, type AdminPostStatusFilterInput } from '@/schemas/post.schema'

type AdminBlogPageProps = {
  searchParams: Promise<{ status?: string | string[] }>
}

function getStatusParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const resolvedSearchParams = await searchParams
  const rawStatus = getStatusParam(resolvedSearchParams.status)

  const parsedStatus = adminPostStatusFilterSchema.safeParse(
    rawStatus ? rawStatus.toUpperCase() : undefined
  )

  const selectedStatus: AdminPostStatusFilterInput = parsedStatus.success
    ? parsedStatus.data
    : 'PENDING'

  const posts = await getAdminPosts(selectedStatus)

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="eyebrow">Panel de control</p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Moderación del blog
              </h1>
              <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
                Revisa artículos enviados por la comunidad. Solo artículos aprobados se publican en el blog.
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

        <AdminBlogModeration posts={posts} selectedStatus={selectedStatus} />
      </section>
    </div>
  )
}
