'use client'

import { useState, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Search,
  X,
  Flag,
  ImageIcon,
  ExternalLink,
  MessageSquareWarning,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import { updateReviewStatusAction, bulkUpdateReviewsAction } from '@/actions/reviews'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { AdminReviewFiltersInput } from '@/schemas/review.schema'
import type { ReviewAdminListItem, ReviewStats } from '@/lib/queries/reviews'

type AdminReviewModerationProps = {
  reviews: ReviewAdminListItem[]
  stats: ReviewStats
  categories: { id: string; name: string; slug: string }[]
  currentFilters: AdminReviewFiltersInput
}

const statusFilters: Array<{ label: string; value: string }> = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobadas', value: 'APPROVED' },
  { label: 'Rechazadas', value: 'REJECTED' },
]

const entityTypeFilters: Array<{ label: string; value: string }> = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Locales', value: 'VENUE' },
  { label: 'Eventos', value: 'EVENT' },
]

const sortOptions: Array<{ label: string; value: string }> = [
  { label: 'Más recientes', value: 'newest' },
  { label: 'Más antiguas', value: 'oldest' },
  { label: 'Menor estrellas', value: 'lowest-rating' },
  { label: 'Mayor estrellas', value: 'highest-rating' },
]

const ratingFilters = [1, 2, 3, 4, 5]

const statusPillStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
}

const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

function buildFilterUrl(currentFilters: AdminReviewFiltersInput, overrides: Partial<AdminReviewFiltersInput>): string {
  const params = new URLSearchParams()
  const merged = { ...currentFilters, ...overrides }

  if (merged.status !== 'ALL') params.set('status', merged.status)
  if (merged.entityType !== 'ALL') params.set('entityType', merged.entityType)
  if (merged.rating) params.set('rating', String(merged.rating))
  if (merged.category) params.set('category', merged.category)
  if (merged.search) params.set('search', merged.search)
  if (merged.flagged) params.set('flagged', 'true')
  if (merged.sort !== 'newest') params.set('sort', merged.sort)

  const qs = params.toString()
  return `/admin/resenas${qs ? `?${qs}` : ''}`
}

export function AdminReviewModeration({
  reviews,
  stats,
  categories,
  currentFilters,
}: AdminReviewModerationProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchInput, setSearchInput] = useState(currentFilters.search)
  const [showFilters, setShowFilters] = useState(false)

  const handleStatusUpdate = useCallback((reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(reviewId)
    startTransition(async () => {
      const result = await updateReviewStatusAction({ reviewId, status })
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo actualizar.')
        setUpdatingId(null)
        return
      }
      toast.success(status === 'APPROVED' ? 'Reseña aprobada.' : 'Reseña rechazada.')
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(reviewId)
        return next
      })
      router.refresh()
      setUpdatingId(null)
    })
  }, [router])

  const handleBulkAction = useCallback((status: 'APPROVED' | 'REJECTED') => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    startTransition(async () => {
      const result = await bulkUpdateReviewsAction(ids, status)
      if (!result.success) {
        toast.error(result.error ?? 'No se pudieron actualizar las reseñas.')
        return
      }
      toast.success(`${result.data?.count ?? ids.length} reseñas ${status === 'APPROVED' ? 'aprobadas' : 'rechazadas'}.`)
      setSelectedIds(new Set())
      router.refresh()
    })
  }, [selectedIds, router])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === reviews.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(reviews.map((r) => r.id)))
    }
  }

  const handleSearch = () => {
    router.push(buildFilterUrl(currentFilters, { search: searchInput }))
  }

  const clearSearch = () => {
    setSearchInput('')
    router.push(buildFilterUrl(currentFilters, { search: '' }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-xl">Resumen de reseñas</CardTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-muted-foreground">Total</p>
              <p className="text-2xl font-medium">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Pendientes</p>
              <p className="text-2xl font-medium">{stats.pending}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">Aprobadas</p>
              <p className="text-2xl font-medium">{stats.approved}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <p className="font-semibold">Rechazadas</p>
              <p className="text-2xl font-medium">{stats.rejected}</p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
              <p className="font-semibold flex items-center gap-1">
                <Flag className="h-3.5 w-3.5" /> Spam/Flag
              </p>
              <p className="text-2xl font-medium">{stats.flagged}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                asChild
                className={cn(
                  'h-9 px-4 text-sm',
                  currentFilters.status === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border/80 bg-background text-foreground hover:bg-accent'
                )}
              >
                <Link href={buildFilterUrl(currentFilters, { status: filter.value as AdminReviewFiltersInput['status'] })}>
                  {filter.label}
                </Link>
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              {entityTypeFilters.map((filter) => (
                <Button
                  key={filter.value}
                  asChild
                  size="sm"
                  className={cn(
                    'h-8 px-3 text-xs',
                    currentFilters.entityType === filter.value
                      ? 'bg-secondary text-foreground'
                      : 'border border-border/80 bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Link href={buildFilterUrl(currentFilters, { entityType: filter.value as AdminReviewFiltersInput['entityType'] })}>
                    {filter.label}
                  </Link>
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {ratingFilters.map((r) => (
                <Button
                  key={r}
                  asChild
                  size="sm"
                  className={cn(
                    'h-8 px-2 text-xs gap-1',
                    currentFilters.rating === r
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border/80 bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Link href={buildFilterUrl(currentFilters, { rating: currentFilters.rating === r ? undefined : r })}>
                    {r}<Star className="h-3 w-3" />
                  </Link>
                </Button>
              ))}
            </div>

            <Button
              asChild
              size="sm"
              className={cn(
                'h-8 px-3 text-xs gap-1',
                currentFilters.flagged
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'border border-border/80 bg-background text-muted-foreground hover:bg-accent'
              )}
            >
              <Link href={buildFilterUrl(currentFilters, { flagged: !currentFilters.flagged })}>
                <Flag className="h-3 w-3" /> Spam/Flag
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="h-3 w-3" /> Más filtros
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
              <div className="space-y-1">
                <Label className="text-xs">Categoría</Label>
                <div className="flex flex-wrap gap-1">
                  <Button
                    asChild
                    size="sm"
                    className={cn(
                      'h-7 px-2 text-xs',
                      !currentFilters.category
                        ? 'bg-secondary text-foreground'
                        : 'border border-border/80 bg-background text-muted-foreground hover:bg-accent'
                    )}
                  >
                    <Link href={buildFilterUrl(currentFilters, { category: '' })}>Todas</Link>
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      asChild
                      size="sm"
                      className={cn(
                        'h-7 px-2 text-xs',
                        currentFilters.category === cat.slug
                          ? 'bg-secondary text-foreground'
                          : 'border border-border/80 bg-background text-muted-foreground hover:bg-accent'
                      )}
                    >
                      <Link href={buildFilterUrl(currentFilters, { category: currentFilters.category === cat.slug ? '' : cat.slug })}>
                        {cat.name}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Ordenar por</Label>
                <div className="flex gap-1">
                  {sortOptions.map((opt) => (
                    <Button
                      key={opt.value}
                      asChild
                      size="sm"
                      className={cn(
                        'h-7 px-2 text-xs',
                        currentFilters.sort === opt.value
                          ? 'bg-secondary text-foreground'
                          : 'border border-border/80 bg-background text-muted-foreground hover:bg-accent'
                      )}
                    >
                      <Link href={buildFilterUrl(currentFilters, { sort: opt.value as AdminReviewFiltersInput['sort'] })}>
                        {opt.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar en reseñas..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 h-9"
              />
              {searchInput && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button size="sm" className="h-9" onClick={handleSearch}>
              Buscar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {selectedIds.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <span className="text-sm font-medium">
              {selectedIds.size} reseña{selectedIds.size > 1 ? 's' : ''} seleccionada{selectedIds.size > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={isPending}
                onClick={() => handleBulkAction('APPROVED')}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Aprobar seleccionadas
              </Button>
              <Button
                size="sm"
                className="h-8 bg-rose-600 text-white hover:bg-rose-700"
                disabled={isPending}
                onClick={() => handleBulkAction('REJECTED')}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Rechazar seleccionadas
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => setSelectedIds(new Set())}
              >
                Deseleccionar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reviews.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={toggleSelectAll}
          >
            {selectedIds.size === reviews.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
          </Button>
        </div>
      )}

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay reseñas para los filtros seleccionados.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        {reviews.map((review) => {
          const isUpdatingCurrent = isPending && updatingId === review.id
          const isSelected = selectedIds.has(review.id)
          const entityName = review.venue?.name ?? review.event?.title ?? 'Desconocido'
          const entitySlug = review.venue?.slug ?? review.event?.slug
          const entityType = review.venue ? 'locales' : 'eventos'
          const categoryName = review.venue?.venueCategories?.[0]?.category?.name ?? review.event?.eventCategories?.[0]?.category?.name
          const isFlagged = review.flaggedReason !== null

          return (
            <Card
              key={review.id}
              className={cn(
                'border-border/70 transition-colors',
                isSelected && 'border-primary/50 bg-primary/5',
                isFlagged && review.status === 'PENDING' && 'border-orange-300 bg-orange-50/30'
              )}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(review.id)}
                    className="mt-1 h-4 w-4 rounded border-border accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {review.title ?? 'Sin título'}
                        </CardTitle>
                        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusPillStyles[review.status])}>
                          {statusLabel[review.status]}
                        </span>
                        {isFlagged && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
                            <AlertTriangle className="h-3 w-3" />
                            {review.flaggedReason === 'PROFANITY' ? 'Lenguaje' : review.flaggedReason}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-4 w-4',
                              i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {review.content && (
                      <p className="mt-2 text-sm text-muted-foreground">{review.content}</p>
                    )}

                    {review.photos.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {review.photos.map((photo) => (
                          <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={photo.url}
                              alt=""
                              className="h-16 w-16 rounded-lg object-cover shrink-0 hover:opacity-80 transition-opacity"
                            />
                          </a>
                        ))}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <ImageIcon className="h-3.5 w-3.5" /> {review.photos.length}
                        </span>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                      <p className="inline-flex items-center gap-1.5">
                        <span className="font-medium">Usuario:</span> {review.user.name ?? 'Anónimo'}
                        <span className="rounded bg-muted px-1 py-0.5 text-[10px]">Nivel {review.user.reviewerLevel}</span>
                      </p>
                      <p className="inline-flex items-center gap-1.5">
                        <span className="font-medium">{review.venue ? 'Local' : 'Evento'}:</span>
                        {entitySlug ? (
                          <Link
                            href={`/${entityType}/${entitySlug}`}
                            target="_blank"
                            className="hover:underline inline-flex items-center gap-1"
                          >
                            {entityName} <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          entityName
                        )}
                      </p>
                      {categoryName && (
                        <p>
                          <span className="font-medium">Categoría:</span> {categoryName}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Fecha:</span>{' '}
                        {new Date(review.createdAt).toLocaleDateString('es-EC', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {review.ownerReply && (
                      <div className="mt-2 rounded-lg border border-border/50 bg-muted/30 p-2 text-xs">
                        <span className="font-medium">Respuesta del dueño:</span>{' '}
                        <span className="text-muted-foreground">{review.ownerReply}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                <div className="flex flex-wrap gap-2">
                  {entitySlug && (
                    <Button asChild className="h-9 border border-border/80 bg-background text-foreground hover:bg-accent">
                      <Link href={`/${entityType}/${entitySlug}`} target="_blank">
                        Ver {review.venue ? 'local' : 'evento'}
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {review.status !== 'APPROVED' && (
                    <Button
                      type="button"
                      disabled={isUpdatingCurrent}
                      onClick={() => handleStatusUpdate(review.id, 'APPROVED')}
                      className="h-9 bg-emerald-600 px-4 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                  )}

                  {review.status !== 'REJECTED' && (
                    <Button
                      type="button"
                      disabled={isUpdatingCurrent}
                      onClick={() => handleStatusUpdate(review.id, 'REJECTED')}
                      className="h-9 bg-rose-600 px-4 text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rechazar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
