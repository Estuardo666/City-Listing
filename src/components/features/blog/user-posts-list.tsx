'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit2,
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  PenLine,
  Search,
  XCircle,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getUserTagsWithCount } from '@/lib/queries/tags'
import type { UserPostListItem } from '@/types/post'

type StatusFilter = 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Publicados', value: 'APPROVED' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Rechazados', value: 'REJECTED' },
]

const statusConfig: Record<string, { label: string; icon: React.ElementType; pill: string }> = {
  APPROVED: { label: 'Publicado', icon: CheckCircle2, pill: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  PENDING:  { label: 'En revisión', icon: Clock,         pill: 'bg-amber-100 text-amber-800 border-amber-200' },
  REJECTED: { label: 'Rechazado',  icon: XCircle,        pill: 'bg-rose-100 text-rose-800 border-rose-200' },
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

type PostsResponse = {
  items: UserPostListItem[]
  total: number
  hasMore: boolean
}

const PAGE_SIZE = 10

export function UserPostsList() {
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const { data: userTags } = useQuery({
    queryKey: ['user-tags'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/tags')
      if (!response.ok) throw new Error('No se pudieron cargar las etiquetas')
      return response.json() as Promise<{ id: string; name: string; slug: string; _count: { posts: number } }[]>
    },
  })

  const query = useInfiniteQuery<PostsResponse>({
    queryKey: ['dashboard-posts', filter, debouncedSearch, selectedTag],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        skip: String(pageParam),
        take: String(PAGE_SIZE),
        status: filter,
      })
      if (debouncedSearch) params.set('q', debouncedSearch)
      if (selectedTag) params.set('tag', selectedTag)

      const response = await fetch(`/api/dashboard/posts?${params.toString()}`)
      if (!response.ok) throw new Error('No se pudo cargar los artículos')
      return response.json() as Promise<PostsResponse>
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      const loaded = allPages.reduce((acc, page) => acc + page.items.length, 0)
      return loaded
    },
    initialPageParam: 0,
  })

  useEffect(() => {
    if (!query.error) return
    toast.error('No se pudo cargar tus artículos.')
  }, [query.error])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage])

  const posts = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data]
  )

  const counts = {
    ALL: query.data?.pages[0]?.total ?? 0,
    APPROVED: filter === 'APPROVED' ? query.data?.pages[0]?.total ?? 0 : undefined,
    PENDING: filter === 'PENDING' ? query.data?.pages[0]?.total ?? 0 : undefined,
    REJECTED: filter === 'REJECTED' ? query.data?.pages[0]?.total ?? 0 : undefined,
  }

  const loadingInitial = query.isLoading

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por título o contenido..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              filter === f.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {f.label}
            <span className={cn(
              'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
              filter === f.value ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
            )}>
              {counts[f.value] ?? '-'}
            </span>
          </button>
        ))}
      </div>

      {/* Tag filter */}
      {userTags && userTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Filtrar por etiqueta:</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedTag('')}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                !selectedTag
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              <Hash className="h-3 w-3" />
              Todos
            </button>
            {userTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.slug)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  selectedTag === tag.slug
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                <Hash className="h-3 w-3" />
                {tag.name}
                <span className="text-[10px] opacity-60">({tag._count.posts})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {loadingInitial ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-4">
              <Skeleton className="h-16 w-20 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card px-6 py-14 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            {search
              ? `Sin resultados para "${search}"`
              : filter === 'ALL'
                ? 'Aún no has escrito ningún artículo.'
                : `No tienes artículos con estado "${STATUS_FILTERS.find((f) => f.value === filter)?.label}".`}
          </p>
          {filter === 'ALL' && (
            <Button asChild className="mt-4 h-9">
              <Link href="/dashboard/blog/crear">
                <PenLine className="mr-2 h-4 w-4" />
                Escribir mi primer artículo
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const cfg = statusConfig[post.status] ?? statusConfig.PENDING
            const StatusIcon = cfg.icon

            return (
              <div
                key={post.id}
                className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-border"
              >
                {/* Thumbnail */}
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-accent">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                      {post.title}
                    </h3>
                    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', cfg.pill)}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>

                  {post.excerpt && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{post.excerpt}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      {post.category.icon ?? '📝'} {post.category.name}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {post.publishedAt ? formatDate(post.publishedAt) : `Creado ${formatDate(post.createdAt)}`}
                    </span>
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-0.5 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          <Hash className="h-2.5 w-2.5" />
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    asChild
                    className="h-8 border border-border/80 bg-background px-3 text-xs text-foreground hover:bg-accent"
                  >
                    <Link href={`/dashboard/blog/${post.id}/editar`}>
                      <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                      Editar
                    </Link>
                  </Button>
                  {post.status === 'APPROVED' && (
                    <Button
                      asChild
                      className="h-8 border border-border/80 bg-background px-3 text-xs text-foreground hover:bg-accent"
                    >
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}

          <div ref={sentinelRef} className="h-4" />

          {query.isFetchingNextPage && (
            <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando más artículos...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
