import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPostBySlug, getRelatedPosts } from '@/lib/queries/posts'
import { incrementPostViewAction } from '@/actions/posts/increment-view'
import { BlogDetail } from '@/components/features/blog'
import { BlogCard } from '@/components/features/blog'
import { FavoriteButton } from '@/components/features/favorites/favorite-button'
import { CommentSection } from '@/components/features/comments/comment-section'
import type { CommentWithUser } from '@/actions/comments'
import type { PostListItem } from '@/types/post'
import { JsonLd } from '@/components/json-ld'
import { buildArticleJsonLd, buildBreadcrumbListJsonLd } from '@/lib/seo/json-ld-builders'

export const revalidate = 3600

type BlogSlugPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogSlugPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Artículo no encontrado' }

  const description = post.excerpt ?? post.content.slice(0, 160)
  const canonical = `https://viveloja.com/blog/${post.slug}`

  return {
    title: `${post.title} — Vive Loja Blog`,
    description,
    openGraph: {
      title: post.title,
      description,
      url: canonical,
      siteName: 'ViveLoja',
      type: 'article',
      locale: 'es_EC',
      images: post.image ? [post.image] : [],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: post.title,
      description,
      images: post.image ? [post.image] : [],
    },
    alternates: {
      canonical,
    },
  }
}

export default async function BlogSlugPage({ params }: BlogSlugPageProps) {
  const { slug } = await params
  const [post, session] = await Promise.all([
    getPostBySlug(slug),
    getServerSession(authOptions),
  ])

  if (!post) notFound()

  // Increment view count
  await incrementPostViewAction(post.id)

  const prismaAny = prisma as unknown as {
    comment: {
      findMany: (args: unknown) => Promise<CommentWithUser[]>
    }
  }

  const [related, isFavorite, comments] = await Promise.all([
    getRelatedPosts(post.categoryId, post.slug),
    session?.user?.id
      ? prisma.favorite.findUnique({
          where: { userId_postId: { userId: session.user.id, postId: post.id } },
          select: { id: true },
        }).then(Boolean)
      : Promise.resolve(false),
    prismaAny.comment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, content: true, parentId: true, createdAt: true,
        user: { select: { id: true, name: true, image: true } },
      },
    }),
  ])

  const articleJsonLd = buildArticleJsonLd({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    image: post.image,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    user: { name: post.user.name, image: null },
    category: post.category ? { name: post.category.name, slug: post.category.slug } : null,
  })

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Inicio', url: 'https://viveloja.com' },
    { name: 'Blog', url: 'https://viveloja.com/blog' },
    ...(post.category
      ? [{ name: post.category.name, url: `https://viveloja.com/${post.category.slug}` }]
      : []),
    { name: post.title },
  ])

  return (
    <div className="min-h-screen bg-background pt-14">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className="relative">
        <div className="absolute right-4 top-4 z-10 sm:right-6">
          <FavoriteButton postId={post.id} initialIsFavorite={isFavorite} />
        </div>
        <BlogDetail post={post} />
      </div>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <CommentSection initialComments={comments} postId={post.id} />
        </div>
      </section>

      {related.length > 0 ? (
        <section className="border-t border-border/40 bg-accent/20 px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-xl font-semibold text-foreground">Artículos relacionados</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p: PostListItem) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
