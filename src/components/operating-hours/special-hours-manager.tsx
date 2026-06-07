'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createSpecialHoursAction, deleteSpecialHoursAction } from '@/actions/special-hours'
import { formatDate } from '@/lib/utils'
import { Calendar, Trash2 } from 'lucide-react'

interface SpecialHoursItem {
  id: string
  date: Date
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
  note: string | null
}

interface SpecialHoursManagerProps {
  venueId: string
  initialData: SpecialHoursItem[]
}

export function SpecialHoursManager({ venueId, initialData }: SpecialHoursManagerProps) {
  const [items, setItems] = useState(initialData)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ date: '', openTime: '09:00', closeTime: '18:00', isClosed: false, note: '' })

  async function handleAdd() {
    if (!form.date) { toast.error('Selecciona una fecha.'); return }
    setLoading(true)
    try {
      const result = await createSpecialHoursAction(venueId, {
        date: form.date,
        openTime: form.isClosed ? null : form.openTime,
        closeTime: form.isClosed ? null : form.closeTime,
        isClosed: form.isClosed,
        note: form.note || null,
      })
      if (result.success && result.data) {
        setItems((prev) => [...prev, result.data!].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
        setShowForm(false)
        setForm({ date: '', openTime: '09:00', closeTime: '18:00', isClosed: false, note: '' })
        toast.success('Horario especial guardado.')
      } else {
        toast.error(result.error ?? 'Error.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const result = await deleteSpecialHoursAction(id)
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.id !== id))
        toast.success('Eliminado.')
      } else {
        toast.error(result.error ?? 'Error.')
      }
    } catch {
      toast.error('Error inesperado.')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Horarios especiales
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Agregar'}
        </Button>
      </div>

      {showForm && (
        <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border bg-muted/30">
          <div className="col-span-2">
            <Label className="text-xs">Fecha</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="text-sm" />
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <input type="checkbox" id="isClosed" checked={form.isClosed} onChange={(e) => setForm((p) => ({ ...p, isClosed: e.target.checked }))} />
            <Label htmlFor="isClosed" className="text-xs">Cerrado todo el día</Label>
          </div>
          {!form.isClosed && (
            <>
              <div>
                <Label className="text-xs">Apertura</Label>
                <Input type="time" value={form.openTime} onChange={(e) => setForm((p) => ({ ...p, openTime: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Cierre</Label>
                <Input type="time" value={form.closeTime} onChange={(e) => setForm((p) => ({ ...p, closeTime: e.target.value }))} className="text-sm" />
              </div>
            </>
          )}
          <div className="col-span-2">
            <Label className="text-xs">Nota (opcional)</Label>
            <Input placeholder="Ej: Día festivo" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} className="text-sm" />
          </div>
          <div className="col-span-2">
            <Button size="sm" onClick={handleAdd} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </div>
      )}

      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border text-sm">
          <div>
            <span className="font-medium">{formatDate(item.date)}</span>
            <span className="ml-2 text-muted-foreground">
              {item.isClosed ? 'Cerrado' : `${item.openTime ?? '?'} - ${item.closeTime ?? '?'}`}
            </span>
            {item.note && <span className="ml-2 text-xs text-muted-foreground">({item.note})</span>}
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(item.id)}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      ))}

      {items.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground">No hay horarios especiales configurados.</p>
      )}
    </div>
  )
}
