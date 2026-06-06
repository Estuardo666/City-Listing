'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { upsertOperatingHoursAction } from '@/actions/operating-hours'

interface OperatingHoursData {
  mon: string | null
  tue: string | null
  wed: string | null
  thu: string | null
  fri: string | null
  sat: string | null
  sun: string | null
  notes: string | null
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
}

interface OperatingHoursFormProps {
  venueId: string
  initialData?: OperatingHoursData | null
  onSuccess?: () => void
}

export function OperatingHoursForm({ venueId, initialData, onSuccess }: OperatingHoursFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    mon: initialData?.mon ?? '',
    tue: initialData?.tue ?? '',
    wed: initialData?.wed ?? '',
    thu: initialData?.thu ?? '',
    fri: initialData?.fri ?? '',
    sat: initialData?.sat ?? '',
    sun: initialData?.sun ?? '',
    notes: initialData?.notes ?? '',
  })

  function handleChange(day: string, value: string) {
    setForm((prev) => ({ ...prev, [day]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await upsertOperatingHoursAction(venueId, {
        mon: form.mon || null,
        tue: form.tue || null,
        wed: form.wed || null,
        thu: form.thu || null,
        fri: form.fri || null,
        sat: form.sat || null,
        sun: form.sun || null,
        notes: form.notes || null,
      })

      if (result.success) {
        toast.success('Horarios guardados correctamente.')
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Error al guardar horarios.')
      }
    } catch {
      toast.error('Error inesperado. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3">
        {Object.entries(DAY_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-3">
            <Label className="w-24 text-sm shrink-0">{label}</Label>
            <Input
              placeholder="09:00-18:00 o 09:00-13:00,16:00-20:00"
              value={form[key as keyof typeof form]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="text-sm"
            />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">Notas (opcional)</Label>
        <Textarea
          placeholder="Ej: Cerrado en feriados, horario especial en navidad..."
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          rows={2}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Deja vacío el día si el local está cerrado. Formato: HH:MM-HH:MM. Para horario partido usa comas: 09:00-13:00,16:00-20:00
      </p>
      <Button type="submit" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar horarios'}
      </Button>
    </form>
  )
}
