'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { updateVenueClaimStatusAction } from '@/actions/venue-claims'

export function ClaimActions({ claimId }: { claimId: string }) {
  const [loading, setLoading] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  async function handleAction(status: 'APPROVED' | 'REJECTED') {
    setLoading(true)
    try {
      const result = await updateVenueClaimStatusAction({
        claimId,
        status,
        adminNotes: adminNotes.trim() || null,
      })
      if (result.success) {
        toast.success(`Reclamo ${status === 'APPROVED' ? 'aprobado' : 'rechazado'}`)
      } else {
        toast.error(result.error ?? 'Error')
      }
    } catch {
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {showNotes && (
        <Textarea
          placeholder="Notas internas (opcional)..."
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          maxLength={500}
          rows={2}
          className="text-sm"
        />
      )}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => handleAction('APPROVED')} disabled={loading}>
          Aprobar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleAction('REJECTED')}
          disabled={loading}
        >
          Rechazar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowNotes(!showNotes)}
          disabled={loading}
        >
          {showNotes ? 'Ocultar notas' : 'Agregar notas'}
        </Button>
      </div>
    </div>
  )
}
