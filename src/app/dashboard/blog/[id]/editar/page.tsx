import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { getPostCategories } from '@/lib/queries/posts'
import { prisma } from '@/lib/prisma'
import { PostEditForm } from '@/components/features/blog/post-edit-form'
import { Button } from '@/components/ui/button'

type EditPostPageProps = {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Editar artículo — Dashboard',
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')

  const [post, categories] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        image: true,
        categoryId: true,
        featured: true,
        status: true,
        userId: true,
      },
    }),
    getPostCategories(),
  ])

  if (!post) notFound()

  const isOwner = post.userId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'

  if (!isOwner && !isAdmin) redirect('/dashboard/blog')

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
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Editar artículo</h1>
          {post.status === 'REJECTED' && (
            <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
              Este artículo fue rechazado. Puedes editarlo y se enviará nuevamente a revisión.
            </p>
          )}
          {post.status === 'APPROVED' && (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Este artículo está publicado. Al guardar cambios quedará en revisión nuevamente.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <PostEditForm
            postId={post.id}
            categories={categories}
            initialData={{
              title: post.title,
              excerpt: post.excerpt ?? null,
              content: post.content,
              image: post.image ?? null,
              categoryId: post.categoryId,
              featured: post.featured,
              tags: [],
            }}
          />
        </div>

      </section>
    </div>
  )
}
