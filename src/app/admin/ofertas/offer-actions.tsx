'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updatePromotionStatusAction } from '@/actions/promotions'

export function OfferActions({ promotionId }: { promotionId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleAction(status: 'ACTIVE' | 'REJECTED') {
    setLoading(true)
    try {
      const result = await updatePromotionStatusAction({ promotionId, status })
      if (result.success) {
        toast.success(`Oferta ${status === 'ACTIVE' ? 'aprobada' : 'rechazada'}`)
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
      <Button size="sm" onClick={() => handleAction('ACTIVE')} disabled={loading}>
        Aprobar
      </Button>
      <Button size="sm" variant="destructive" onClick={() => handleAction('REJECTED')} disabled={loading}>
        Rechazar
      </Button>
    </div>
  )
}
