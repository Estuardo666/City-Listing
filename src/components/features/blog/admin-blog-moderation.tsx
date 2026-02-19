'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, CheckCircle2, FileText, User2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { updatePostStatusAction } from '@/actions/posts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AdminPostStatusFilterInput } from '@/schemas/post.schema'
import type { PostAdminListItem } from '@/types/post'

type AdminBlogModerationProps = {
  posts: PostAdminListItem[]
  selectedStatus: AdminPostStatusFilterInput
}

const statusFilters: Array<{ label: string; value: AdminPostStatusFilterInput }> = [
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobados', value: 'APPROVED' },
  { label: 'Rechazados', value: 'REJECTED' },
  { label: 'Todos', value: 'ALL' },
]

const statusLabel: Record<'PENDING' | 'APPROVED' | 'REJECTED', string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
}

const statusPillStyles: Record<'PENDING' | 'APPROVED' | 'REJECTED', string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function AdminBlogModeration({ posts, selectedStatus }: AdminBlogModerationProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [updatingPostId, setUpdatingPostId] = useState<string | null>(null)

  const statusSummary = useMemo(() => {
    return posts.reduce(
      (acc, post) => {
        if (post.status === 'PENDING' || post.status === 'APPROVED' || post.status === 'REJECTED') {
          acc[post.status] += 1
        }
        return acc
      },
      { PENDING: 0, APPROVED: 0, REJECTED: 0 }
    )
  }, [posts])

  const handleStatusUpdate = (postId: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingPostId(postId)
    startTransition(async () => {
      const result = await updatePostStatusAction({ postId, status })
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo actualizar el estado del artículo.')
        setUpdatingPostId(null)
        return
      }
      toast.success(status === 'APPROVED' ? 'Artículo aprobado y publicado.' : 'Artículo rechazado.')
      router.refresh()
      setUpdatingPostId(null)
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-xl">Moderación del blog</CardTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Pendientes</p>
              <p>{statusSummary.PENDING}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">Aprobados</p>
              <p>{statusSummary.APPROVED}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <p className="font-semibold">Rechazados</p>
              <p>{statusSummary.REJECTED}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                asChild
                className={cn(
                  'h-9 px-4 text-sm',
                  selectedStatus === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border/80 bg-background text-foreground hover:bg-accent'
                )}
              >
                <Link href={`/admin/blog?status=${filter.value}`}>{filter.label}</Link>
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay artículos para el filtro seleccionado.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        {posts.map((post) => {
          const postStatus =
            post.status === 'PENDING' || post.status === 'APPROVED' || post.status === 'REJECTED'
              ? post.status
              : 'PENDING'

          const isUpdatingCurrent = isPending && updatingPostId === post.id

          return (
            <Card key={post.id} className="border-border/70">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold', statusPillStyles[postStatus])}>
                    {statusLabel[postStatus]}
                  </span>
                </div>

                {post.excerpt ? (
                  <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                ) : null}

                <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                  <p className="inline-flex items-center gap-2">
                    <User2 className="h-3.5 w-3.5" />
                    {post.user.name ?? post.user.email ?? 'Sin autor'}
                  </p>
                  <p className="text-muted-foreground">Categoría: {post.category.name}</p>
                  <p className="inline-flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Creado: {formatDate(post.createdAt)}
                  </p>
                  {post.publishedAt ? (
                    <p className="inline-flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      Publicado: {formatDate(post.publishedAt)}
                    </p>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                {postStatus === 'APPROVED' ? (
                  <Button asChild className="h-9 border border-border/80 bg-background text-foreground hover:bg-accent">
                    <Link href={`/blog/${post.slug}`}>Ver artículo</Link>
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex flex-wrap gap-2">
                  {postStatus !== 'APPROVED' ? (
                    <Button
                      type="button"
                      disabled={isUpdatingCurrent}
                      onClick={() => handleStatusUpdate(post.id, 'APPROVED')}
                      className="h-9 bg-emerald-600 px-4 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                  ) : null}

                  {postStatus !== 'REJECTED' ? (
                    <Button
                      type="button"
                      disabled={isUpdatingCurrent}
                      onClick={() => handleStatusUpdate(post.id, 'REJECTED')}
                      className="h-9 bg-rose-600 px-4 text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rechazar
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
