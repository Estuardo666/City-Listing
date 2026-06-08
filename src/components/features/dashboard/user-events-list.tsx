'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowDownUp, CalendarDays, CheckCircle2, Clock, Edit2,
  ExternalLink, ImageIcon, Loader2, MapPin, Search, Trash2, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { bulkDeleteEventsAction } from '@/actions/events'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { UserEventListItem } from '@/types/event'

type StatusFilter = 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Publicados', value: 'APPROVED' },
  { label: 'En revisión', value: 'PENDING' },
  { label: 'Rechazados', value: 'REJECTED' },
]

const SORT_OPTIONS = [
  { label: 'Más recientes', value: 'newest' },
  { label: 'Más antiguos', value: 'oldest' },
  { label: 'Nombre A-Z', value: 'title-asc' },
  { label: 'Nombre Z-A', value: 'title-desc' },
  { label: 'Próximos primero', value: 'startDate-asc' },
  { label: 'Más lejanos primero', value: 'startDate-desc' },
]

const statusConfig: Record<string, { label: string; icon: React.ElementType; pill: string }> = {
  APPROVED: { label: 'Publicado',   icon: CheckCircle2, pill: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  PENDING:  { label: 'En revisión', icon: Clock,         pill: 'bg-amber-100 text-amber-800 border-amber-200' },
  REJECTED: { label: 'Rechazado',   icon: XCircle,       pill: 'bg-rose-100 text-rose-800 border-rose-200' },
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

type EventsResponse = {
  items: UserEventListItem[]
  total: number
  hasMore: boolean
}

const PAGE_SIZE = 10

export function UserEventsList() {
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const query = useInfiniteQuery<EventsResponse>({
    queryKey: ['dashboard-events', filter, debouncedSearch, sort],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        skip: String(pageParam),
        take: String(PAGE_SIZE),
        status: filter,
        sort,
      })
      if (debouncedSearch) params.set('q', debouncedSearch)

      const response = await fetch(`/api/dashboard/events?${params.toString()}`)
      if (!response.ok) throw new Error('No se pudo cargar los eventos')
      return response.json() as Promise<EventsResponse>
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
    toast.error('No se pudo cargar tus eventos.')
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

  const events = useMemo(
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

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === events.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(events.map((e) => e.id)))
    }
  }, [selectedIds.size, events])

  const handleBulkDelete = useCallback(async () => {
    setIsDeleting(true)
    const ids = Array.from(selectedIds)
    const result = await bulkDeleteEventsAction(ids)
    if (!result.success) {
      toast.error(result.error ?? 'No se pudieron eliminar los eventos.')
    } else {
      toast.success(`${result.data?.count ?? ids.length} eventos eliminados.`)
      setSelectedIds(new Set())
      query.refetch()
    }
    setIsDeleting(false)
    setShowBulkDeleteDialog(false)
  }, [selectedIds, query])

  return (
    <div className="space-y-4">
      {/* Search + Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o ubicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative">
          <ArrowDownUp className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
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

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/50 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium">
            {selectedIds.size} evento{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-8 bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Eliminar seleccionados
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
        </div>
      )}

      {/* Select all */}
      {events.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={toggleSelectAll}
          >
            {selectedIds.size === events.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {loadingInitial ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-4">
              <Skeleton className="h-16 w-20 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-52" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card px-6 py-12 text-center">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {search ? `Sin resultados para "${search}"` : 'No hay eventos en esta categoría.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const cfg = statusConfig[event.status] ?? statusConfig.PENDING
            const StatusIcon = cfg.icon
            const isSelected = selectedIds.has(event.id)
            return (
              <div
                key={event.id}
                className={cn(
                  'flex items-start gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-border',
                  isSelected ? 'border-primary/50 bg-primary/5' : 'border-border/60'
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(event.id)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
                />
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-accent">
                  {event.image ? (
                    <Image src={event.image} alt={event.title} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{event.title}</h3>
                    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', cfg.pill)}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{event.eventCategories[0]?.category.icon ?? '📅'} {event.eventCategories[0]?.category.name}</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(event.startDate)}
                    </span>
                    {event.address && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.address}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button asChild className="h-8 border border-border/80 bg-background px-3 text-xs text-foreground hover:bg-accent">
                    <Link href={`/dashboard/eventos/${event.slug}/editar`}>
                      <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                      Editar
                    </Link>
                  </Button>
                  {event.status === 'APPROVED' && (
                    <Button asChild className="h-8 border border-border/80 bg-background px-3 text-xs text-foreground hover:bg-accent">
                      <Link href={`/eventos/${event.slug}`} target="_blank">
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
              Cargando más eventos...
            </div>
          )}
        </div>
      )}

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar eventos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshace. Se eliminarán permanentemente {selectedIds.size} evento{selectedIds.size > 1 ? 's' : ''} y todos sus datos asociados (reseñas, favoritos, comentarios, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
