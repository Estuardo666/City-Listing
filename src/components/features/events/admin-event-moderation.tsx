'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowDownUp, CalendarDays, CheckCircle2, Clock3,
  MapPin, Pencil, Search, Trash2, User2, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  updateEventStatusAction,
  deleteEventAction,
  bulkDeleteEventsAction,
} from '@/actions/events'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { AdminEventStatusFilterInput } from '@/schemas/event.schema'
import type { EventAdminListItem } from '@/types/event'

type AdminEventModerationProps = {
  events: EventAdminListItem[]
  categories: { id: string; name: string; slug: string }[]
  currentFilters: {
    status: AdminEventStatusFilterInput
    category: string
    sort: string
    q: string
  }
}

const STATUS_FILTERS: Array<{ label: string; value: AdminEventStatusFilterInput }> = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobados', value: 'APPROVED' },
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

const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
}

const statusPillStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' }).format(new Date(date))
}

function buildFilterUrl(
  current: AdminEventModerationProps['currentFilters'],
  overrides: Partial<AdminEventModerationProps['currentFilters']>
) {
  const params = new URLSearchParams()
  const merged = { ...current, ...overrides }

  if (merged.status !== 'ALL') params.set('status', merged.status)
  if (merged.category) params.set('category', merged.category)
  if (merged.sort !== 'newest') params.set('sort', merged.sort)
  if (merged.q) params.set('q', merged.q)

  const qs = params.toString()
  return `/admin/eventos${qs ? `?${qs}` : ''}`
}

export function AdminEventModeration({ events, categories, currentFilters }: AdminEventModerationProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchInput, setSearchInput] = useState(currentFilters.q)
  const [dialogAction, setDialogAction] = useState<'delete' | null>(null)

  const statusSummary = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        if (event.status === 'PENDING' || event.status === 'APPROVED' || event.status === 'REJECTED') {
          acc[event.status] += 1
        }
        return acc
      },
      { PENDING: 0, APPROVED: 0, REJECTED: 0 }
    )
  }, [events])

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

  const handleStatusUpdate = useCallback((eventId: string, status: 'APPROVED' | 'REJECTED') => {
    startTransition(async () => {
      const result = await updateEventStatusAction({ eventId, status })
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo actualizar el estado.')
        return
      }
      toast.success(status === 'APPROVED' ? 'Evento aprobado.' : 'Evento rechazado.')
      router.refresh()
    })
  }, [router])

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    startTransition(async () => {
      const result = await bulkDeleteEventsAction(ids)
      if (result.success) {
        toast.success(`${result.data?.count ?? ids.length} eventos eliminados.`)
        setSelectedIds(new Set())
        setDialogAction(null)
      } else {
        toast.error(result.error ?? 'No se pudieron eliminar los eventos.')
      }
      router.refresh()
    })
  }, [selectedIds, router])

  const handleSearch = () => {
    router.push(buildFilterUrl(currentFilters, { q: searchInput }))
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Pendientes</p>
          <p className="font-semibold">{statusSummary.PENDING}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Aprobados</p>
          <p className="font-semibold">{statusSummary.APPROVED}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Rechazados</p>
          <p className="font-semibold">{statusSummary.REJECTED}</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              asChild
              size="sm"
              className={cn(
                'h-7 px-2.5 text-xs',
                currentFilters.status === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border/80 bg-background text-muted-foreground hover:bg-accent'
              )}
            >
              <Link href={buildFilterUrl(currentFilters, { status: f.value })}>{f.label}</Link>
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <ArrowDownUp className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={currentFilters.sort}
              onChange={(e) => router.push(buildFilterUrl(currentFilters, { sort: e.target.value }))}
              className="h-8 rounded-md border border-input bg-background pl-8 pr-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={currentFilters.category}
              onChange={(e) => router.push(buildFilterUrl(currentFilters, { category: e.target.value }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Button size="sm" className="h-8 text-xs" onClick={handleSearch}>
            Buscar
          </Button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/50 bg-primary/5 px-3 py-2">
          <span className="text-xs font-medium">
            {selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              className="h-7 bg-rose-600 text-xs text-white hover:bg-rose-700"
              onClick={() => setDialogAction('delete')}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Eliminar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
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
            className="h-7 text-xs"
            onClick={toggleSelectAll}
          >
            {selectedIds.size === events.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </Button>
          <span className="text-xs text-muted-foreground">
            {events.length} evento{events.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">No hay eventos para los filtros seleccionados.</p>
        </div>
      )}

      {/* Compact rows */}
      <div className="space-y-1.5">
        {events.map((event) => {
          const eventStatus =
            event.status === 'PENDING' || event.status === 'APPROVED' || event.status === 'REJECTED'
              ? event.status
              : 'PENDING'
          const cfg = { label: statusLabel[eventStatus], pill: statusPillStyles[eventStatus] }
          const isSelected = selectedIds.has(event.id)

          return (
            <div
              key={event.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-colors hover:border-border',
                isSelected ? 'border-primary/50 bg-primary/5' : 'border-border/60'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(event.id)}
                className="h-4 w-4 shrink-0 rounded border-border accent-primary"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="line-clamp-1 text-sm font-medium text-foreground">{event.title}</h3>
                  <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-semibold', cfg.pill)}>
                    {cfg.label}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span>{event.eventCategories[0]?.category.name ?? 'Sin categoría'}</span>
                  <span className="inline-flex items-center gap-0.5">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(event.startDate)}
                  </span>
                  {(event.address ?? event.location) && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {event.address ?? event.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5">
                    <User2 className="h-3 w-3" />
                    {event.user.name ?? event.user.email ?? 'Sin autor'}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                >
                  <Link href={`/admin/eventos/${event.id}/editar`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>

                {eventStatus !== 'APPROVED' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={() => handleStatusUpdate(event.id, 'APPROVED')}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                )}

                {eventStatus !== 'REJECTED' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleStatusUpdate(event.id, 'REJECTED')}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={dialogAction !== null} onOpenChange={() => setDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {selectedIds.size} evento{selectedIds.size > 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshace. Se eliminarán permanentemente los eventos seleccionados y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isPending}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
