'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { upsertRecurrenceAction, deleteRecurrenceAction } from '@/actions/recurrence'

interface RecurrenceFormProps {
  eventId: string
  initialData?: {
    frequency: string
    interval: number
    daysOfWeek: string | null
    dayOfMonth: number | null
    startDate: Date
    endDate: Date | null
    count: number | null
  } | null
  onSuccess?: () => void
}

const DAY_OPTIONS = [
  { value: 'MON', label: 'Lun' },
  { value: 'TUE', label: 'Mar' },
  { value: 'WED', label: 'Mié' },
  { value: 'THU', label: 'Jue' },
  { value: 'FRI', label: 'Vie' },
  { value: 'SAT', label: 'Sáb' },
  { value: 'SUN', label: 'Dom' },
]

export function RecurrenceForm({ eventId, initialData, onSuccess }: RecurrenceFormProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    frequency: initialData?.frequency ?? 'WEEKLY',
    interval: initialData?.interval ?? 1,
    daysOfWeek: initialData?.daysOfWeek ? JSON.parse(initialData.daysOfWeek) as string[] : [] as string[],
    dayOfMonth: initialData?.dayOfMonth ?? 1,
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
    count: initialData?.count ?? '',
  })

  function toggleDay(day: string) {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await upsertRecurrenceAction(eventId, {
        frequency: form.frequency,
        interval: form.interval,
        daysOfWeek: form.frequency === 'WEEKLY' && form.daysOfWeek.length > 0
          ? JSON.stringify(form.daysOfWeek)
          : null,
        dayOfMonth: form.frequency === 'MONTHLY' ? form.dayOfMonth : null,
        startDate: form.startDate,
        endDate: form.endDate || null,
        count: form.count ? Number(form.count) : null,
      })

      if (result.success) {
        toast.success('Recurrencia guardada.')
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

  async function handleDelete() {
    setDeleting(true)
    try {
      const result = await deleteRecurrenceAction(eventId)
      if (result.success) {
        toast.success('Recurrencia eliminada.')
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Error al eliminar.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Frecuencia</Label>
          <Select
            value={form.frequency}
            onValueChange={(value) => setForm((prev) => ({ ...prev, frequency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WEEKLY">Semanal</SelectItem>
              <SelectItem value="MONTHLY">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Cada N {form.frequency === 'WEEKLY' ? 'semanas' : 'meses'}</Label>
          <Input
            type="number"
            min={1}
            max={12}
            value={form.interval}
            onChange={(e) => setForm((prev) => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
          />
        </div>
      </div>

      {form.frequency === 'WEEKLY' && (
        <div className="space-y-1.5">
          <Label>Días de la semana</Label>
          <div className="flex gap-1.5">
            {DAY_OPTIONS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                  form.daysOfWeek.includes(day.value)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {form.frequency === 'MONTHLY' && (
        <div className="space-y-1.5">
          <Label>Día del mes</Label>
          <Input
            type="number"
            min={1}
            max={31}
            value={form.dayOfMonth}
            onChange={(e) => setForm((prev) => ({ ...prev, dayOfMonth: parseInt(e.target.value) || 1 }))}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Desde</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Hasta (opcional)</Label>
          <Input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Máximo ocurrencias (opcional)</Label>
        <Input
          type="number"
          min={1}
          max={100}
          placeholder="Sin límite"
          value={form.count}
          onChange={(e) => setForm((prev) => ({ ...prev, count: e.target.value }))}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar recurrencia'}
        </Button>
        {initialData && (
          <Button type="button" variant="destructive" disabled={deleting} onClick={handleDelete}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        )}
      </div>
    </form>
  )
}
