'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createVenueClaimAction } from '@/actions/venue-claims'

interface ClaimVenueFormProps {
  venueId: string
  onSuccess?: () => void
}

export function ClaimVenueForm({ venueId, onSuccess }: ClaimVenueFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [proof, setProof] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createVenueClaimAction(venueId, {
        message: message || null,
        proof: proof || null,
      })

      if (result.success) {
        toast.success('Reclamo enviado. Un administrador lo revisará.')
        setMessage('')
        setProof('')
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Error al enviar reclamo.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Mensaje (opcional)</Label>
        <Textarea
          placeholder="Describe por qué eres el dueño de este local..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Prueba (URL opcional)</Label>
        <Input
          placeholder="URL a documento o foto que demuestre propiedad"
          value={proof}
          onChange={(e) => setProof(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar reclamo'}
      </Button>
    </form>
  )
}
