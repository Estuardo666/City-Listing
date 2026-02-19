import Link from 'next/link'
import { PenLine } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPosts, getPostCategories } from '@/lib/queries/posts'
import { getAllTags } from '@/lib/queries/tags'
import { getTrendingPosts } from '@/lib/queries/trending'
import { BlogCard } from '@/components/features/blog'
import { TrendingSection } from '@/components/features/blog/trending-section'
import { Button } from '@/components/ui/button'
import { MotionDiv, fadeInUp, staggerContainer } from '@/components/ui/motion'

export const metadata = {
  title: 'Blog — CityListing Loja',
  description: 'Artículos, guías y entrevistas sobre Loja, Ecuador.',
}

type BlogPageProps = {
  searchParams: Promise<{ category?: string; tag?: string; q?: string }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const resolved = await searchParams
  const session = await getServerSession(authOptions)

  const [posts, categories, tags, trending] = await Promise.all([
    getPosts({
      status: 'APPROVED',
      category: resolved.category ?? '',
      tag: resolved.tag ?? '',
      q: resolved.q ?? '',
    }),
    getPostCategories(),
    getAllTags(),
    // Only show trending on main page, not filtered
    !resolved.category && !resolved.tag && !resolved.q ? getTrendingPosts('week', 3) : Promise.resolve([]),
  ])

  const featured = posts.filter((p) => p.featured)
  const rest = posts.filter((p) => !p.featured)

  return (
    <div className="min-h-screen bg-background pt-14">
      {/* Hero */}
      <section className="border-b border-border/40 bg-gradient-to-b from-accent/30 to-background px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <MotionDiv {...fadeInUp} className="space-y-4">
            <p className="eyebrow">CityListing Blog</p>
            <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              Historias de Loja
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Guías, entrevistas y artículos sobre la vida, cultura y gastronomía de Loja, Ecuador.
            </p>
            {session?.user ? (
              <Button asChild className="mt-2 h-10">
                <Link href="/blog/crear">
                  <PenLine className="mr-2 h-4 w-4" />
                  Escribir artículo
                </Link>
              </Button>
            ) : null}
          </MotionDiv>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Category filters */}
        {categories.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/blog"
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                !resolved.category && !resolved.tag
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              Todos
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  resolved.category === cat.slug && !resolved.tag
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {cat.icon ?? ''} {cat.name}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Tag filters */}
        {tags && tags.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/blog?tag=${tag.slug}`}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  resolved.tag === tag.slug
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Trending posts */}
        <TrendingSection posts={trending} period="week" />

        {/* Featured posts */}
        {featured.length > 0 && !resolved.category && !resolved.q ? (
          <section className="mb-12">
            <h2 className="mb-5 text-xl font-semibold text-foreground">Destacados</h2>
            <MotionDiv
              {...staggerContainer}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {featured.map((post) => (
                <MotionDiv key={post.id} {...fadeInUp}>
                  <BlogCard post={post} />
                </MotionDiv>
              ))}
            </MotionDiv>
          </section>
        ) : null}

        {/* All posts */}
        {rest.length > 0 || (featured.length === 0) ? (
          <section>
            {featured.length > 0 && !resolved.category && !resolved.q ? (
              <h2 className="mb-5 text-xl font-semibold text-foreground">Todos los artículos</h2>
            ) : null}

            {posts.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-card px-6 py-16 text-center">
                <p className="text-muted-foreground">No hay artículos disponibles.</p>
                {session?.user ? (
                  <Button asChild className="mt-4 h-9">
                    <Link href="/blog/crear">Sé el primero en escribir</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              <MotionDiv
                {...staggerContainer}
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {(resolved.category || resolved.q ? posts : rest).map((post) => (
                  <MotionDiv key={post.id} {...fadeInUp}>
                    <BlogCard post={post} />
                  </MotionDiv>
                ))}
              </MotionDiv>
            )}
          </section>
        ) : null}
      </div>
    </div>
  )
}
