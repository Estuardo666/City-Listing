import { TrendingUp } from 'lucide-react'
import { BlogCard } from './blog-card'
import type { PostListItem } from '@/types/post'

type TrendingSectionProps = {
  posts: PostListItem[]
  period?: 'week' | 'month'
}

export function TrendingSection({ posts, period = 'week' }: TrendingSectionProps) {
  if (posts.length === 0) return null

  const periodLabel = period === 'week' ? 'esta semana' : 'este mes'

  return (
    <section className="mb-12">
      <div className="mb-5 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-orange-500" />
        <h2 className="text-xl font-semibold text-foreground">Trending {periodLabel}</h2>
        <span className="text-sm text-muted-foreground">
          Lo más popular {periodLabel}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <div key={post.id} className="relative">
            {/* Trending number badge */}
            <div className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white shadow-lg">
              {index + 1}
            </div>
            <BlogCard post={post} />
          </div>
        ))}
      </div>
    </section>
  )
}
