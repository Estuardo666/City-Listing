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

/**
 * Legacy simple form — use ClaimVenueWizard for the full multistep experience.
 */
export function ClaimVenueForm({ venueId, onSuccess }: ClaimVenueFormProps) {
  const [loading, setLoading] = useState(false)
  const [claimerName, setClaimerName] = useState('')
  const [claimerEmail, setClaimerEmail] = useState('')
  const [claimerPhone, setClaimerPhone] = useState('')
  const [claimerRole, setClaimerRole] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createVenueClaimAction({
        venueId,
        claimerName: claimerName.trim(),
        claimerEmail: claimerEmail.trim(),
        claimerPhone: claimerPhone.trim() || null,
        claimerRole: claimerRole.trim() || null,
        message: message.trim() || null,
      })

      if (result.success) {
        toast.success('Reclamo enviado. Revisa tu correo para verificar.')
        setClaimerName('')
        setClaimerEmail('')
        setClaimerPhone('')
        setClaimerRole('')
        setMessage('')
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
        <Label>Nombre completo *</Label>
        <Input
          placeholder="Juan Pérez"
          value={claimerName}
          onChange={(e) => setClaimerName(e.target.value)}
          maxLength={120}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Correo electrónico *</Label>
        <Input
          type="email"
          placeholder="juan@ejemplo.com"
          value={claimerEmail}
          onChange={(e) => setClaimerEmail(e.target.value)}
          maxLength={200}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input
            type="tel"
            placeholder="0999999999"
            value={claimerPhone}
            onChange={(e) => setClaimerPhone(e.target.value)}
            maxLength={30}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Cargo</Label>
          <Input
            placeholder="Propietario"
            value={claimerRole}
            onChange={(e) => setClaimerRole(e.target.value)}
            maxLength={80}
          />
        </div>
      </div>
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
      <Button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar reclamo'}
      </Button>
    </form>
  )
}
