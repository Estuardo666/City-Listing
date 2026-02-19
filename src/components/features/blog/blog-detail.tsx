import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Hash, User2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PostWithRelations } from '@/types/post'

type BlogDetailProps = {
  post: PostWithRelations
}

function formatDate(date: Date | string | null): string {
  if (!date) return ''
  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function BlogDetail({ post }: BlogDetailProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
      {/* Back */}
      <Button
        asChild
        className="mb-8 h-9 border border-border/80 bg-background text-foreground hover:bg-accent"
      >
        <Link href="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al blog
        </Link>
      </Button>

      {/* Category badge */}
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
        {post.category.icon ?? '📝'} {post.category.name}
      </span>

      {/* Title */}
      <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
        {post.title}
      </h1>

      {/* Meta */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User2 className="h-4 w-4" />
          {post.user.name ?? post.user.email ?? 'Autor'}
        </span>
        {post.publishedAt ? (
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatDate(post.publishedAt)}
          </span>
        ) : null}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <Hash className="h-3 w-3" />
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Excerpt */}
      {post.excerpt ? (
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
      ) : null}

      {/* Hero image */}
      {post.image ? (
        <div className="relative mt-8 h-72 w-full overflow-hidden rounded-2xl border border-border/60 sm:h-96">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      ) : null}

      {/* Content */}
      <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary prose-img:rounded-xl">
        {post.content.split('\n').map((paragraph, i) =>
          paragraph.trim() ? (
            <p key={i} className="mb-4 leading-relaxed text-foreground/90">
              {paragraph}
            </p>
          ) : null
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-border/50 pt-8">
        <Button
          asChild
          className="h-10 border border-border/80 bg-background text-foreground hover:bg-accent"
        >
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ver más artículos
          </Link>
        </Button>
      </div>
    </article>
  )
}
