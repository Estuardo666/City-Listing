import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { getPostCategories } from '@/lib/queries/posts'
import { BlogForm } from '@/components/features/blog'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Escribir artículo — Dashboard',
}

export default async function DashboardBlogCrearPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')

  const categories = await getPostCategories()

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            asChild
            className="h-9 border border-border/80 bg-background text-foreground hover:bg-accent"
          >
            <Link href="/dashboard/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Mis artículos
            </Link>
          </Button>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blog</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Escribir artículo
          </h1>
          <p className="text-sm text-muted-foreground">
            Tu artículo será revisado por el equipo antes de publicarse.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <BlogForm categories={categories} redirectTo="/dashboard/blog" />
        </div>

      </section>
    </div>
  )
}
