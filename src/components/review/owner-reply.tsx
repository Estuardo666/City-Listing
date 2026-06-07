'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { replyToReviewAction } from '@/actions/reviews'
import { formatDate } from '@/lib/utils'

interface OwnerReplyProps {
  reviewId: string
  ownerReply: string | null
  ownerReplyAt: Date | null
  isOwner: boolean
}

export function OwnerReply({ reviewId, ownerReply, ownerReplyAt, isOwner }: OwnerReplyProps) {
  const [showForm, setShowForm] = useState(false)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentReply, setCurrentReply] = useState(ownerReply)
  const [currentReplyAt, setCurrentReplyAt] = useState(ownerReplyAt)

  async function handleSubmit() {
    if (!reply.trim()) return
    setLoading(true)
    try {
      const result = await replyToReviewAction(reviewId, { reply: reply.trim() })
      if (result.success && result.data) {
        setCurrentReply(result.data.ownerReply)
        setCurrentReplyAt(result.data.ownerReplyAt)
        setShowForm(false)
        setReply('')
        toast.success('Respuesta publicada.')
      } else {
        toast.error(result.error ?? 'Error al responder.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  if (currentReply) {
    return (
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Respuesta del propietario</span>
          {currentReplyAt && (
            <span className="text-xs text-emerald-600/60 dark:text-emerald-400/60">{formatDate(currentReplyAt)}</span>
          )}
        </div>
        <p className="text-sm text-emerald-800 dark:text-emerald-300">{currentReply}</p>
      </div>
    )
  }

  if (!isOwner) return null

  return (
    <div className="mt-3">
      {showForm ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Escribe tu respuesta..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={500}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={loading || !reply.trim()}>
              {loading ? 'Enviando...' : 'Responder'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setReply('') }}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="text-xs">
          Responder
        </Button>
      )}
    </div>
  )
}
