'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2, EyeOff, Eye, MapPin, Pencil, Trash2, User2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { updateVenueStatusAction, deleteVenueAction, toggleVenueActiveAction } from '@/actions/venues'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { AdminVenueStatusFilterInput } from '@/schemas/venue.schema'
import type { VenueAdminListItem } from '@/types/venue'

type AdminVenueModerationProps = {
  venues: VenueAdminListItem[]
  selectedStatus: AdminVenueStatusFilterInput
}

const statusFilters: Array<{ label: string; value: AdminVenueStatusFilterInput }> = [
  { label: 'Borradores', value: 'DRAFT' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobados', value: 'APPROVED' },
  { label: 'Rechazados', value: 'REJECTED' },
  { label: 'Todos', value: 'ALL' },
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

export function AdminVenueModeration({ venues, selectedStatus }: AdminVenueModerationProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [updatingVenueId, setUpdatingVenueId] = useState<string | null>(null)
  const [deletingVenueId, setDeletingVenueId] = useState<string | null>(null)
  const [togglingVenueId, setTogglingVenueId] = useState<string | null>(null)

  const statusSummary = useMemo(() => {
    return venues.reduce(
      (acc, venue) => {
        if (venue.status in acc) {
          acc[venue.status as keyof typeof acc] += 1
        }
        return acc
      },
      {
        DRAFT: 0,
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
      }
    )
  }, [venues])

  const handleStatusUpdate = (venueId: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingVenueId(venueId)

    startTransition(async () => {
      const result = await updateVenueStatusAction({ venueId, status })

      if (!result.success) {
        toast.error(result.error ?? 'No se pudo actualizar el estado del local.')
        setUpdatingVenueId(null)
        return
      }

      toast.success(status === 'APPROVED' ? 'Local aprobado correctamente.' : 'Local rechazado correctamente.')
      router.refresh()
      setUpdatingVenueId(null)
    })
  }

  const handleDelete = (venueId: string) => {
    setDeletingVenueId(venueId)

    startTransition(async () => {
      const result = await deleteVenueAction(venueId)

      if (!result.success) {
        toast.error(result.error ?? 'No se pudo eliminar el local.')
        setDeletingVenueId(null)
        return
      }

      toast.success('Local eliminado correctamente.')
      router.refresh()
      setDeletingVenueId(null)
    })
  }

  const handleToggleActive = (venueId: string) => {
    setTogglingVenueId(venueId)

    startTransition(async () => {
      const result = await toggleVenueActiveAction(venueId)

      if (!result.success) {
        toast.error(result.error ?? 'No se pudo cambiar el estado del local.')
        setTogglingVenueId(null)
        return
      }

      toast.success(result.data?.isActive ? 'Local activado correctamente.' : 'Local desactivado correctamente.')
      router.refresh()
      setTogglingVenueId(null)
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-xl">Moderación de locales</CardTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
              <p className="font-semibold">Borradores</p>
              <p>{statusSummary.DRAFT}</p>
            </div>
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
                <Link href={`/admin/locales?status=${filter.value}`}>{filter.label}</Link>
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {venues.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay locales para el filtro seleccionado.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        {venues.map((venue) => {
          const venueStatus = venue.status in statusPillStyles ? venue.status : 'PENDING'

          const isUpdatingCurrent = isPending && updatingVenueId === venue.id
          const isDeletingCurrent = isPending && deletingVenueId === venue.id
          const isTogglingCurrent = isPending && togglingVenueId === venue.id

          return (
            <Card key={venue.id} className="border-border/70">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-lg">{venue.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {!venue.isActive && (
                      <span className="rounded-full border px-3 py-1 text-xs font-semibold bg-gray-200 text-gray-600 border-gray-300">
                        Inactivo
                      </span>
                    )}
                    <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold', statusPillStyles[venueStatus])}>
                      {statusLabel[venueStatus]}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{venue.description}</p>

                <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                  <p className="inline-flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {venue.address ?? venue.location}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <User2 className="h-3.5 w-3.5" />
                    {venue.user.name ?? venue.user.email ?? 'Sin autor'}
                  </p>
                  <p className="text-muted-foreground">Categoría: {venue.venueCategories[0]?.category.name}</p>
                  <p className="inline-flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    {venue._count.events} eventos asociados
                  </p>
                </div>
              </CardHeader>

              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button asChild className="h-9 border border-border/80 bg-background text-foreground hover:bg-accent">
                    <Link href={`/locales/${venue.slug}`}>Ver detalle</Link>
                  </Button>

                  <Button asChild className="h-9 border border-border/80 bg-background text-foreground hover:bg-accent">
                    <Link href={`/admin/locales/${venue.id}/editar`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {venueStatus !== 'APPROVED' ? (
                    <Button
                      type="button"
                      disabled={isUpdatingCurrent || isDeletingCurrent || isTogglingCurrent}
                      onClick={() => handleStatusUpdate(venue.id, 'APPROVED')}
                      className="h-9 bg-emerald-600 px-4 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                  ) : null}

                  {venueStatus !== 'REJECTED' ? (
                    <Button
                      type="button"
                      disabled={isUpdatingCurrent || isDeletingCurrent || isTogglingCurrent}
                      onClick={() => handleStatusUpdate(venue.id, 'REJECTED')}
                      className="h-9 bg-rose-600 px-4 text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rechazar
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    disabled={isUpdatingCurrent || isDeletingCurrent || isTogglingCurrent}
                    onClick={() => handleToggleActive(venue.id)}
                    className={cn(
                      'h-9 px-4 text-white disabled:opacity-60',
                      venue.isActive
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    )}
                  >
                    {venue.isActive ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Activar
                      </>
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        disabled={isUpdatingCurrent || isDeletingCurrent || isTogglingCurrent}
                        className="h-9 bg-rose-700 px-4 text-white hover:bg-rose-800 disabled:opacity-60"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar local?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshace. Se eliminará permanentemente el local
                          <span className="font-semibold"> {venue.name}</span> y todos sus datos asociados
                          (eventos, reseñas, favoritos, etc.).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(venue.id)}
                          className="bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
