'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StarRatingInput } from '@/components/review/star-rating'
import { toast } from 'sonner'
import { createReviewAction } from '@/actions/reviews'

interface ReviewFormProps {
  entityType: 'venue' | 'event'
  entityId: string
  onSuccess?: () => void
}

export function ReviewForm({ entityType, entityId, onSuccess }: ReviewFormProps) {
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Selecciona una calificación.')
      return
    }

    setLoading(true)

    try {
      const result = await createReviewAction(entityType, entityId, {
        rating,
        title: title || null,
        content: content || null,
      })

      if (result.success) {
        toast.success('Reseña publicada correctamente.')
        setRating(0)
        setTitle('')
        setContent('')
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Error al publicar reseña.')
      }
    } catch {
      toast.error('Error inesperado. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Tu calificación</Label>
        <StarRatingInput value={rating} onChange={setRating} size="lg" />
      </div>
      <div className="space-y-1.5">
        <Label>Título (opcional)</Label>
        <Input
          placeholder="Resumen de tu experiencia"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Reseña (opcional)</Label>
        <Textarea
          placeholder="Cuéntanos tu experiencia..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={1000}
          rows={3}
        />
      </div>
      <Button type="submit" disabled={loading || rating === 0}>
        {loading ? 'Publicando...' : 'Publicar reseña'}
      </Button>
    </form>
  )
}
