'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createPromotionAction } from '@/actions/promotions'

interface PromotionFormProps {
  venueId: string
  onSuccess?: () => void
}

export function PromotionForm({ venueId, onSuccess }: PromotionFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    discount: '',
    validFrom: '',
    validUntil: '',
    terms: '',
  })

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createPromotionAction(venueId, {
        ...form,
        image: form.image || null,
        discount: form.discount || null,
        terms: form.terms || null,
      })

      if (result.success) {
        toast.success('Oferta creada. Pendiente de aprobación.')
        setForm({ title: '', description: '', image: '', discount: '', validFrom: '', validUntil: '', terms: '' })
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Error al crear oferta.')
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
        <Label>Título</Label>
        <Input
          placeholder="Ej: Happy Hour 2x1 en cócteles"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
          maxLength={120}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Textarea
          placeholder="Describe la oferta..."
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          required
          maxLength={500}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Descuento</Label>
          <Input
            placeholder="2x1, 30%, etc."
            value={form.discount}
            onChange={(e) => handleChange('discount', e.target.value)}
            maxLength={50}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Imagen (URL)</Label>
          <Input
            placeholder="https://..."
            value={form.image}
            onChange={(e) => handleChange('image', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Válida desde</Label>
          <Input
            type="datetime-local"
            value={form.validFrom}
            onChange={(e) => handleChange('validFrom', e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Válida hasta</Label>
          <Input
            type="datetime-local"
            value={form.validUntil}
            onChange={(e) => handleChange('validUntil', e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Términos y condiciones (opcional)</Label>
        <Textarea
          placeholder="Condiciones de la oferta..."
          value={form.terms}
          onChange={(e) => handleChange('terms', e.target.value)}
          maxLength={500}
          rows={2}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear oferta'}
      </Button>
    </form>
  )
}
