import { getPosts } from '@/lib/queries/posts'
import { BlogCard } from '@/components/features/blog'
import { MotionDiv, fadeInUp, viewportOnce } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export async function HomeBlogSection() {
  const featuredPosts = await getPosts({ status: 'APPROVED', featured: 'true' })
  
  if (featuredPosts.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">📖 Inspírate</p>
          <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Guías para salir mejor</h2>
        </div>
        <Button asChild variant="outline" className="h-11 rounded-xl">
          <Link href="/blog">
            Ver blog <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {featuredPosts.slice(0, 3).map((post) => (
          <MotionDiv key={post.id} {...fadeInUp} viewport={viewportOnce}>
            <BlogCard post={post} />
          </MotionDiv>
        ))}
      </div>
    </section>
  )
}
