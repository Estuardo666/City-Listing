'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createReservationAction } from '@/actions/reservations'
import { formatDate } from '@/lib/utils'

interface ReservationFormProps {
  venueId?: string
  eventId?: string
  onSuccess?: () => void
}

export function ReservationForm({ venueId, eventId, onSuccess }: ReservationFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: '',
    time: '19:00',
    partySize: 2,
    notes: '',
  })

  function handleChange(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createReservationAction({
        venueId,
        eventId,
        date: form.date,
        time: form.time,
        partySize: form.partySize,
        notes: form.notes || null,
      })

      if (result.success) {
        toast.success('Reserva creada correctamente.')
        setForm({ date: '', time: '19:00', partySize: 2, notes: '' })
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Error al crear reserva.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Fecha</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
            min={today}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Hora</Label>
          <Input
            type="time"
            value={form.time}
            onChange={(e) => handleChange('time', e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Número de personas</Label>
        <Input
          type="number"
          min={1}
          max={50}
          value={form.partySize}
          onChange={(e) => handleChange('partySize', parseInt(e.target.value) || 1)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Notas (opcional)</Label>
        <Textarea
          placeholder="Alergias, preferencias de mesa, ocasión especial..."
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          maxLength={500}
          rows={2}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Reservando...' : 'Hacer reserva'}
      </Button>
    </form>
  )
}
