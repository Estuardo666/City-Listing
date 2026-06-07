'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StarRatingInput } from '@/components/review/star-rating'
import { toast } from 'sonner'
import { createReviewAction } from '@/actions/reviews'
import { Upload, X, ImageIcon, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  entityType: 'venue' | 'event'
  entityId: string
  onSuccess?: () => void
}

const MAX_PHOTOS = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [] }

export function ReviewForm({ entityType, entityId, onSuccess }: ReviewFormProps) {
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (photos.length + acceptedFiles.length > MAX_PHOTOS) {
      toast.error(`Máximo ${MAX_PHOTOS} fotos por reseña.`)
      return
    }

    setUploadingPhotos(true)
    const uploadedUrls: string[] = []

    for (const file of acceptedFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/uploads/media', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (result.success && result.data?.url) {
          uploadedUrls.push(result.data.url)
        } else {
          toast.error(`Error al subir ${file.name}: ${result.error ?? 'Error desconocido'}`)
        }
      } catch {
        toast.error(`Error al subir ${file.name}.`)
      }
    }

    if (uploadedUrls.length > 0) {
      setPhotos((prev) => [...prev, ...uploadedUrls])
      toast.success(`${uploadedUrls.length} foto${uploadedUrls.length > 1 ? 's' : ''} subida${uploadedUrls.length > 1 ? 's' : ''}.`)
    }

    setUploadingPhotos(false)
  }, [photos.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_PHOTOS - photos.length,
    disabled: uploadingPhotos || photos.length >= MAX_PHOTOS,
  })

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Selecciona una calificación.')
      return
    }

    setLoading(true)
    setPendingMessage(null)

    try {
      const result = await createReviewAction(entityType, entityId, {
        rating,
        title: title || null,
        content: content || null,
        photos,
      })

      if (result.success) {
        toast.success('Reseña publicada correctamente.')
        setRating(0)
        setTitle('')
        setContent('')
        setPhotos([])
        setPendingMessage(null)
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

      <div className="space-y-1.5">
        <Label>Fotos (opcional, máx. {MAX_PHOTOS})</Label>

        {photos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {photos.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Foto ${index + 1}`}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {photos.length < MAX_PHOTOS && (
          <div
            {...getRootProps()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 p-4 transition-colors hover:border-primary/50 hover:bg-muted/30',
              isDragActive && 'border-primary bg-primary/5',
              uploadingPhotos && 'pointer-events-none opacity-60'
            )}
          >
            <input {...getInputProps()} />
            {uploadingPhotos ? (
              <>
                <Upload className="h-5 w-5 animate-pulse text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Subiendo fotos...</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Arrastra fotos aquí o haz clic para seleccionar
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  JPEG, PNG, WebP, GIF · Máx 10MB c/u · {photos.length}/{MAX_PHOTOS} fotos
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {pendingMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{pendingMessage}</p>
        </div>
      )}

      <Button type="submit" disabled={loading || rating === 0}>
        {loading ? 'Publicando...' : 'Publicar reseña'}
      </Button>
    </form>
  )
}
