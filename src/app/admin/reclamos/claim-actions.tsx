'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateVenueClaimStatusAction } from '@/actions/venue-claims'

export function ClaimActions({ claimId }: { claimId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleAction(status: 'APPROVED' | 'REJECTED') {
    setLoading(true)
    try {
      const result = await updateVenueClaimStatusAction({ claimId, status, adminNotes: null })
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
    <div className="flex gap-2">
      <Button size="sm" onClick={() => handleAction('APPROVED')} disabled={loading}>
        Aprobar
      </Button>
      <Button size="sm" variant="destructive" onClick={() => handleAction('REJECTED')} disabled={loading}>
        Rechazar
      </Button>
    </div>
  )
}
