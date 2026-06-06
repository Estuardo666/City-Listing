'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { upsertReservationSettingsAction } from '@/actions/reservations'

interface ReservationSettingsFormProps {
  venueId: string
  initialData?: {
    acceptsReservations: boolean
    maxPartySize: number
    timeSlotDuration: number
    openingTime: string
    closingTime: string
    autoConfirm: boolean
    cancelBeforeHours: number
  } | null
  onSuccess?: () => void
}

export function ReservationSettingsForm({ venueId, initialData, onSuccess }: ReservationSettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    acceptsReservations: initialData?.acceptsReservations ?? true,
    maxPartySize: initialData?.maxPartySize ?? 20,
    timeSlotDuration: initialData?.timeSlotDuration ?? 60,
    openingTime: initialData?.openingTime ?? '09:00',
    closingTime: initialData?.closingTime ?? '22:00',
    autoConfirm: initialData?.autoConfirm ?? false,
    cancelBeforeHours: initialData?.cancelBeforeHours ?? 2,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await upsertReservationSettingsAction(venueId, form)

      if (result.success) {
        toast.success('Ajustes de reserva guardados.')
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Error al guardar.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Aceptar reservas</Label>
        <Switch
          checked={form.acceptsReservations}
          onCheckedChange={(checked) => setForm((prev) => ({ ...prev, acceptsReservations: checked }))}
        />
      </div>

      {form.acceptsReservations && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Apertura</Label>
              <Input
                type="time"
                value={form.openingTime}
                onChange={(e) => setForm((prev) => ({ ...prev, openingTime: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cierre</Label>
              <Input
                type="time"
                value={form.closingTime}
                onChange={(e) => setForm((prev) => ({ ...prev, closingTime: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Máx. personas</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.maxPartySize}
                onChange={(e) => setForm((prev) => ({ ...prev, maxPartySize: parseInt(e.target.value) || 20 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duración slot (min)</Label>
              <Input
                type="number"
                min={15}
                max={240}
                value={form.timeSlotDuration}
                onChange={(e) => setForm((prev) => ({ ...prev, timeSlotDuration: parseInt(e.target.value) || 60 }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Confirmación automática</Label>
            <Switch
              checked={form.autoConfirm}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, autoConfirm: checked }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cancelar hasta (horas antes)</Label>
            <Input
              type="number"
              min={1}
              max={72}
              value={form.cancelBeforeHours}
              onChange={(e) => setForm((prev) => ({ ...prev, cancelBeforeHours: parseInt(e.target.value) || 2 }))}
            />
          </div>
        </>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar ajustes'}
      </Button>
    </form>
  )
}
