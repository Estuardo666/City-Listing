'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { upsertBusinessHoursAction, deleteBusinessHoursAction, setDayClosedAction, duplicateDayScheduleAction } from '@/actions/business-hours/manage-hours'
import { Plus, Trash2, Copy, Check, X } from 'lucide-react'
import type { VenueBusinessHours } from '@prisma/client'

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface TimeSlot {
  id?: string
  openTime: string
  closeTime: string
  isClosed: boolean
}

interface DaySchedule {
  dayOfWeek: number
  isClosed: boolean
  slots: TimeSlot[]
}

interface BusinessHoursEditorProps {
  venueId: string
  initialData: VenueBusinessHours[]
}

function buildInitialSchedule(data: VenueBusinessHours[]): DaySchedule[] {
  return Array.from({ length: 7 }, (_, i) => {
    const daySlots = data.filter((d) => d.dayOfWeek === i)
    const closedSlot = daySlots.find((d) => d.isClosed)
    if (closedSlot) {
      return { dayOfWeek: i, isClosed: true, slots: [{ id: closedSlot.id, openTime: '00:00', closeTime: '00:00', isClosed: true }] }
    }
    return {
      dayOfWeek: i,
      isClosed: false,
      slots: daySlots.map((s) => ({ id: s.id, openTime: s.openTime, closeTime: s.closeTime, isClosed: false })),
    }
  })
}

export function BusinessHoursEditor({ venueId, initialData }: BusinessHoursEditorProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => buildInitialSchedule(initialData))
  const [loading, setLoading] = useState(false)
  const [copyFrom, setCopyFrom] = useState<number | null>(null)
  const [copyTargets, setCopyTargets] = useState<Set<number>>(new Set())

  function updateSlot(dayIdx: number, slotIdx: number, field: 'openTime' | 'closeTime', value: string) {
    setSchedule((prev) => {
      const next = [...prev]
      const day = { ...next[dayIdx] }
      const slots = [...day.slots]
      slots[slotIdx] = { ...slots[slotIdx], [field]: value }
      day.slots = slots
      next[dayIdx] = day
      return next
    })
  }

  async function addSlot(dayIdx: number) {
    setSchedule((prev) => {
      const next = [...prev]
      const day = { ...next[dayIdx] }
      day.slots = [...day.slots, { openTime: '09:00', closeTime: '18:00', isClosed: false }]
      day.isClosed = false
      next[dayIdx] = day
      return next
    })
  }

  async function removeSlot(dayIdx: number, slotIdx: number) {
    const slot = schedule[dayIdx].slots[slotIdx]
    if (slot.id) {
      setLoading(true)
      await deleteBusinessHoursAction(slot.id)
      setLoading(false)
    }
    setSchedule((prev) => {
      const next = [...prev]
      const day = { ...next[dayIdx] }
      day.slots = day.slots.filter((_, i) => i !== slotIdx)
      next[dayIdx] = day
      return next
    })
  }

  async function handleToggleClosed(dayIdx: number) {
    const newClosed = !schedule[dayIdx].isClosed
    setLoading(true)
    const result = await setDayClosedAction(venueId, dayIdx, newClosed)
    setLoading(false)
    if (result.success) {
      setSchedule((prev) => {
        const next = [...prev]
        if (newClosed) {
          next[dayIdx] = { dayOfWeek: dayIdx, isClosed: true, slots: [{ openTime: '00:00', closeTime: '00:00', isClosed: true }] }
        } else {
          next[dayIdx] = { dayOfWeek: dayIdx, isClosed: false, slots: [] }
        }
        return next
      })
      toast.success(newClosed ? 'Día marcado como cerrado.' : 'Día abierto.')
    } else {
      toast.error(result.error ?? 'Error.')
    }
  }

  async function saveSlot(dayIdx: number, slotIdx: number) {
    const slot = schedule[dayIdx].slots[slotIdx]
    if (!slot.openTime || !slot.closeTime) {
      toast.error('Completa ambos horarios.')
      return
    }
    if (slot.openTime >= slot.closeTime) {
      toast.error('La apertura debe ser menor que el cierre.')
      return
    }
    setLoading(true)
    const result = await upsertBusinessHoursAction(venueId, {
      dayOfWeek: dayIdx,
      openTime: slot.openTime,
      closeTime: slot.closeTime,
      isClosed: false,
    })
    setLoading(false)
    if (result.success && result.data) {
      setSchedule((prev) => {
        const next = [...prev]
        const day = { ...next[dayIdx] }
        const slots = [...day.slots]
        slots[slotIdx] = { ...slots[slotIdx], id: result.data!.id }
        day.slots = slots
        day.isClosed = false
        next[dayIdx] = day
        return next
      })
      toast.success('Horario guardado.')
    } else {
      toast.error(result.error ?? 'Error al guardar.')
    }
  }

  async function handleDuplicate() {
    if (copyFrom === null || copyTargets.size === 0) return
    setLoading(true)
    const result = await duplicateDayScheduleAction(venueId, copyFrom, Array.from(copyTargets))
    setLoading(false)
    if (result.success) {
      toast.success('Horarios duplicados.')
      setCopyFrom(null)
      setCopyTargets(new Set())
      window.location.reload()
    } else {
      toast.error(result.error ?? 'Error.')
    }
  }

  return (
    <div className="space-y-4">
      {schedule.map((day, dayIdx) => (
        <div key={dayIdx} className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm w-24">{DAY_LABELS[dayIdx]}</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`closed-${dayIdx}`}
                  checked={day.isClosed}
                  onCheckedChange={() => handleToggleClosed(dayIdx)}
                  disabled={loading}
                />
                <Label htmlFor={`closed-${dayIdx}`} className="text-xs text-muted-foreground cursor-pointer">
                  Cerrado
                </Label>
              </div>
            </div>
            <div className="flex gap-1">
              {!day.isClosed && (
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => addSlot(dayIdx)}>
                  <Plus className="h-3 w-3 mr-1" /> Horario
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  if (copyFrom === dayIdx) {
                    setCopyFrom(null)
                    setCopyTargets(new Set())
                  } else {
                    setCopyFrom(dayIdx)
                    setCopyTargets(new Set())
                  }
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copyFrom === dayIdx ? 'Cancelar' : 'Copiar'}
              </Button>
            </div>
          </div>

          {!day.isClosed && day.slots.length > 0 && (
            <div className="p-4 space-y-2">
              {day.slots.map((slot, slotIdx) => (
                <div key={slotIdx} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={slot.openTime}
                    onChange={(e) => updateSlot(dayIdx, slotIdx, 'openTime', e.target.value)}
                    className="w-28 text-sm"
                    disabled={loading}
                  />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input
                    type="time"
                    value={slot.closeTime}
                    onChange={(e) => updateSlot(dayIdx, slotIdx, 'closeTime', e.target.value)}
                    className="w-28 text-sm"
                    disabled={loading}
                  />
                  {!slot.id && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => saveSlot(dayIdx, slotIdx)} disabled={loading}>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => removeSlot(dayIdx, slotIdx)} disabled={loading}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!day.isClosed && day.slots.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Sin horarios definidos. Agrega uno o marca como cerrado.
            </div>
          )}

          {copyFrom !== null && copyFrom !== dayIdx && (
            <div className="px-4 pb-3 flex items-center gap-2">
              <Checkbox
                id={`copy-${dayIdx}`}
                checked={copyTargets.has(dayIdx)}
                onCheckedChange={(checked) => {
                  setCopyTargets((prev) => {
                    const next = new Set(prev)
                    if (checked) next.add(dayIdx)
                    else next.delete(dayIdx)
                    return next
                  })
                }}
              />
              <Label htmlFor={`copy-${dayIdx}`} className="text-xs text-muted-foreground cursor-pointer">
                Pegar aquí
              </Label>
            </div>
          )}
        </div>
      ))}

      {copyFrom !== null && copyTargets.size > 0 && (
        <Button onClick={handleDuplicate} disabled={loading} className="gap-2">
          <Copy className="h-4 w-4" />
          Copiar horarios de {DAY_LABELS[copyFrom]} a {copyTargets.size} día{copyTargets.size > 1 ? 's' : ''}
        </Button>
      )}
    </div>
  )
}
