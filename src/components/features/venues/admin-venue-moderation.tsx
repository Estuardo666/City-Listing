'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowDownUp, CheckCircle2, Eye, EyeOff,
  MapPin, Pencil, Search, Trash2, User2, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  updateVenueStatusAction,
  deleteVenueAction,
  toggleVenueActiveAction,
  bulkDeleteVenuesAction,
  bulkToggleActiveAction,
} from '@/actions/venues'
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
import type { AdminVenueStatusFilterInput } from '@/schemas/venue.schema'
import type { VenueAdminListItem } from '@/types/venue'
import type { VenueCategory } from '@/types/venue'

type AdminVenueModerationProps = {
  venues: VenueAdminListItem[]
  categories: VenueCategory[]
  currentFilters: {
    status: AdminVenueStatusFilterInput
    category: string
    sort: string
    q: string
  }
}

const STATUS_FILTERS: Array<{ label: string; value: AdminVenueStatusFilterInput }> = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Borradores', value: 'DRAFT' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobados', value: 'APPROVED' },
  { label: 'Rechazados', value: 'REJECTED' },
]

const SORT_OPTIONS = [
  { label: 'Más recientes', value: 'newest' },
  { label: 'Más antiguos', value: 'oldest' },
  { label: 'Nombre A-Z', value: 'name-asc' },
  { label: 'Nombre Z-A', value: 'name-desc' },
]

const statusLabel: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
}

const statusPillStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
}

function buildFilterUrl(
  current: AdminVenueModerationProps['currentFilters'],
  overrides: Partial<AdminVenueModerationProps['currentFilters']>
) {
  const params = new URLSearchParams()
  const merged = { ...current, ...overrides }

  if (merged.status !== 'ALL') params.set('status', merged.status)
  if (merged.category) params.set('category', merged.category)
  if (merged.sort !== 'newest') params.set('sort', merged.sort)
  if (merged.q) params.set('q', merged.q)

  const qs = params.toString()
  return `/admin/locales${qs ? `?${qs}` : ''}`
}

export function AdminVenueModeration({ venues, categories, currentFilters }: AdminVenueModerationProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchInput, setSearchInput] = useState(currentFilters.q)
  const [dialogAction, setDialogAction] = useState<'delete' | 'deactivate' | 'activate' | null>(null)

  const statusSummary = useMemo(() => {
    return venues.reduce(
      (acc, venue) => {
        if (venue.status in acc) {
          acc[venue.status as keyof typeof acc] += 1
        }
        return acc
      },
      { DRAFT: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 }
    )
  }, [venues])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === venues.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(venues.map((v) => v.id)))
    }
  }, [selectedIds.size, venues])

  const handleStatusUpdate = useCallback((venueId: string, status: 'APPROVED' | 'REJECTED') => {
    startTransition(async () => {
      const result = await updateVenueStatusAction({ venueId, status })
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo actualizar el estado.')
        return
      }
      toast.success(status === 'APPROVED' ? 'Local aprobado.' : 'Local rechazado.')
      router.refresh()
    })
  }, [router])

  const handleToggleActive = useCallback((venueId: string) => {
    startTransition(async () => {
      const result = await toggleVenueActiveAction(venueId)
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo cambiar el estado.')
        return
      }
      toast.success(result.data?.isActive ? 'Local activado.' : 'Local desactivado.')
      router.refresh()
    })
  }, [router])

  const handleBulkAction = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    startTransition(async () => {
      let result
      if (dialogAction === 'delete') {
        result = await bulkDeleteVenuesAction(ids)
        if (result.success) {
          toast.success(`${result.data?.count ?? ids.length} locales eliminados.`)
        }
      } else if (dialogAction === 'deactivate') {
        result = await bulkToggleActiveAction(ids, false)
        if (result.success) {
          toast.success(`${result.data?.count ?? ids.length} locales desactivados.`)
        }
      } else if (dialogAction === 'activate') {
        result = await bulkToggleActiveAction(ids, true)
        if (result.success) {
          toast.success(`${result.data?.count ?? ids.length} locales activados.`)
        }
      }

      if (result && !result.success) {
        toast.error(result.error ?? 'No se pudo completar la acción.')
      }

      setSelectedIds(new Set())
      setDialogAction(null)
      router.refresh()
    })
  }, [selectedIds, dialogAction, router])

  const handleSearch = () => {
    router.push(buildFilterUrl(currentFilters, { q: searchInput }))
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Borradores</p>
          <p className="font-semibold">{statusSummary.DRAFT}</p>
        </div>
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
              className="h-7 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              onClick={() => setDialogAction('activate')}
            >
              <Eye className="mr-1 h-3 w-3" />
              Activar
            </Button>
            <Button
              size="sm"
              className="h-7 bg-amber-600 text-xs text-white hover:bg-amber-700"
              onClick={() => setDialogAction('deactivate')}
            >
              <EyeOff className="mr-1 h-3 w-3" />
              Desactivar
            </Button>
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
      {venues.length > 0 && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={toggleSelectAll}
          >
            {selectedIds.size === venues.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </Button>
          <span className="text-xs text-muted-foreground">
            {venues.length} local{venues.length !== 1 ? 'es' : ''}
          </span>
        </div>
      )}

      {/* Empty state */}
      {venues.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">No hay locales para los filtros seleccionados.</p>
        </div>
      )}

      {/* Compact rows */}
      <div className="space-y-1.5">
        {venues.map((venue) => {
          const venueStatus = venue.status in statusPillStyles ? venue.status : 'PENDING'
          const cfg = { label: statusLabel[venueStatus], pill: statusPillStyles[venueStatus] }
          const isSelected = selectedIds.has(venue.id)

          return (
            <div
              key={venue.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-colors hover:border-border',
                isSelected ? 'border-primary/50 bg-primary/5' : 'border-border/60'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(venue.id)}
                className="h-4 w-4 shrink-0 rounded border-border accent-primary"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="line-clamp-1 text-sm font-medium text-foreground">{venue.name}</h3>
                  {!venue.isActive && (
                    <span className="rounded-full border px-1.5 py-0.5 text-[10px] font-semibold bg-gray-200 text-gray-600 border-gray-300">
                      Inactivo
                    </span>
                  )}
                  <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-semibold', cfg.pill)}>
                    {cfg.label}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span>{venue.venueCategories[0]?.category.name ?? 'Sin categoría'}</span>
                  {(venue.address ?? venue.location) && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {venue.address ?? venue.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5">
                    <User2 className="h-3 w-3" />
                    {venue.user.name ?? venue.user.email ?? 'Sin autor'}
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
                  <Link href={`/admin/locales/${venue.id}/editar`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>

                {venueStatus !== 'APPROVED' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={() => handleStatusUpdate(venue.id, 'APPROVED')}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                )}

                {venueStatus !== 'REJECTED' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleStatusUpdate(venue.id, 'REJECTED')}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    'h-7 w-7 p-0',
                    venue.isActive
                      ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                      : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                  )}
                  onClick={() => handleToggleActive(venue.id)}
                >
                  {venue.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
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
              {dialogAction === 'delete' && `¿Eliminar ${selectedIds.size} local${selectedIds.size > 1 ? 'es' : ''}?`}
              {dialogAction === 'deactivate' && `¿Desactivar ${selectedIds.size} local${selectedIds.size > 1 ? 'es' : ''}?`}
              {dialogAction === 'activate' && `¿Activar ${selectedIds.size} local${selectedIds.size > 1 ? 'es' : ''}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAction === 'delete' && 'Esta acción no se puede deshace. Se eliminarán permanentemente los locales seleccionados y todos sus datos asociados.'}
              {dialogAction === 'deactivate' && 'Los locales desactivados se ocultarán del público pero seguirán visibles en el admin.'}
              {dialogAction === 'activate' && 'Los locales activados volverán a ser visibles para el público.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              disabled={isPending}
              className={cn(
                dialogAction === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : '',
                dialogAction === 'deactivate' ? 'bg-amber-600 hover:bg-amber-700' : '',
                dialogAction === 'activate' ? 'bg-emerald-600 hover:bg-emerald-700' : '',
                'text-white'
              )}
            >
              {isPending ? 'Procesando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
