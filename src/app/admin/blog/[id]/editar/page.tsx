import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPostCategories } from '@/lib/queries/posts'
import { prisma } from '@/lib/prisma'
import { PostEditForm } from '@/components/features/blog/post-edit-form'

type AdminEditarBlogPageProps = {
  params: Promise<{ id: string }>
}

export default async function AdminEditarBlogPage({ params }: AdminEditarBlogPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const { id } = await params
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

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="space-y-3">
            <p className="eyebrow">Administración</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Editar artículo
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
              Editando: <span className="font-medium">{post.title}</span>
            </p>
          </div>
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
