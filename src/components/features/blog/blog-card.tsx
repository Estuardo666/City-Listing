import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Hash, ImageIcon, MessageCircle, Sparkles, TrendingUp, User2 } from 'lucide-react'
import type { PostListItem } from '@/types/post'
import { PopularBadge } from './popular-badge'

type BlogCardProps = {
  post: PostListItem
}

function formatDate(date: Date | string | null): string {
  if (!date) return ''
  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.99]"
    >
      {/* Image */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-accent">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-accent to-secondary">
            <ImageIcon className="h-10 w-10 text-muted-foreground/25" />
            <span className="text-xs text-muted-foreground/40">Sin imagen</span>
          </div>
        )}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {post.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-coral px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <Sparkles className="h-3 w-3" /> Destacado
            </span>
          ) : null}
          <PopularBadge viewCount={(post as any).viewCount} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
            {post.category.icon ?? '📝'} {post.category.name}
          </span>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map(({ tag }) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-0.5 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  <Hash className="h-2.5 w-2.5" />
                  {tag.name}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <h3 className="mt-3 text-base font-semibold leading-snug text-foreground transition-colors duration-150 group-hover:text-primary">
          {post.title}
        </h3>

        {post.excerpt ? (
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-4 space-y-1.5 border-t border-border/50 pt-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2">
              <User2 className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span className="truncate">{post.user.name ?? post.user.email ?? 'Autor'}</span>
            </p>
            <div className="flex items-center gap-3">
              {(post as any).viewCount && (post as any).viewCount > 0 && (
                <span className="flex items-center gap-1 text-muted-foreground/70">
                  <TrendingUp className="h-3 w-3" />
                  {(post as any).viewCount}
                </span>
              )}
              <span className="flex items-center gap-1 text-muted-foreground/70">
                <MessageCircle className="h-3 w-3" />
                {/* Comment count will be added later */}
                0
              </span>
            </div>
          </div>
          {post.publishedAt ? (
            <p className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <span>{formatDate(post.publishedAt)}</span>
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
