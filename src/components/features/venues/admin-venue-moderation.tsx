'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2, MapPin, User2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { updateVenueStatusAction } from '@/actions/venues'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AdminVenueStatusFilterInput } from '@/schemas/venue.schema'
import type { VenueAdminListItem } from '@/types/venue'

type AdminVenueModerationProps = {
  venues: VenueAdminListItem[]
  selectedStatus: AdminVenueStatusFilterInput
}

const statusFilters: Array<{ label: string; value: AdminVenueStatusFilterInput }> = [
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

export function AdminVenueModeration({ venues, selectedStatus }: AdminVenueModerationProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [updatingVenueId, setUpdatingVenueId] = useState<string | null>(null)

  const statusSummary = useMemo(() => {
    return venues.reduce(
      (acc, venue) => {
        if (venue.status === 'PENDING' || venue.status === 'APPROVED' || venue.status === 'REJECTED') {
          acc[venue.status] += 1
        }
        return acc
      },
      {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-xl">Moderación de locales</CardTitle>
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
          const venueStatus =
            venue.status === 'PENDING' || venue.status === 'APPROVED' || venue.status === 'REJECTED'
              ? venue.status
              : 'PENDING'

          const isUpdatingCurrent = isPending && updatingVenueId === venue.id

          return (
            <Card key={venue.id} className="border-border/70">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-lg">{venue.name}</CardTitle>
                  <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold', statusPillStyles[venueStatus])}>
                    {statusLabel[venueStatus]}
                  </span>
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
                  <p className="text-muted-foreground">Categoría: {venue.category.name}</p>
                  <p className="inline-flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    {venue._count.events} eventos asociados
                  </p>
                </div>
              </CardHeader>

              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <Button asChild className="h-9 border border-border/80 bg-background text-foreground hover:bg-accent">
                  <Link href={`/locales/${venue.slug}`}>Ver detalle</Link>
                </Button>

                <div className="flex flex-wrap gap-2">
                  {venueStatus !== 'APPROVED' ? (
                    <Button
                      type="button"
                      disabled={isUpdatingCurrent}
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
                      disabled={isUpdatingCurrent}
                      onClick={() => handleStatusUpdate(venue.id, 'REJECTED')}
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
