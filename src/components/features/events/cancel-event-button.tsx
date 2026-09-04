'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { cancelEventAction } from '@/actions/events/cancel-event'

export function CancelEventButton({ eventId, cancelled }: { eventId: string; cancelled: boolean }) {
  const [busy, setBusy] = useState(false)
  return <button type="button" disabled={busy || cancelled} className="rounded-lg border border-destructive px-4 py-2 text-destructive disabled:opacity-50" onClick={async () => {
    if (!window.confirm('¿Cancelar este evento? Avisaremos a quienes lo guardaron.')) return
    setBusy(true)
    const result = await cancelEventAction(eventId)
    if (result.success) { toast.success('Evento cancelado. Avisos preparados.'); window.location.reload() }
    else { toast.error(result.error); setBusy(false) }
  }}>{cancelled ? 'Evento cancelado' : busy ? 'Cancelando…' : 'Cancelar evento y avisar'}</button>
}
