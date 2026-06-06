'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { uploadMediaAction, deleteMediaAction } from '@/actions/media'

interface MediaItem {
  id: string
  url: string
  alt: string | null
  type: string
  order: number
}

interface MediaUploaderProps {
  entityType: 'venue' | 'event' | 'post'
  entityId: string
  initialMedia?: MediaItem[]
  onMediaChange?: (media: MediaItem[]) => void
}

export function MediaUploader({ entityType, entityId, initialMedia = [], onMediaChange }: MediaUploaderProps) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia)
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  const handleUpload = useCallback(
    async (url: string, alt?: string) => {
      setUploading(true)
      try {
        const result = await uploadMediaAction(entityType, entityId, {
          url,
          alt: alt ?? null,
          type: 'IMAGE',
        })

        if (result.success && result.data) {
          const updated = [...media, result.data].sort((a, b) => a.order - b.order)
          setMedia(updated)
          onMediaChange?.(updated)
          toast.success('Imagen agregada.')
        } else {
          toast.error(result.error ?? 'Error al subir.')
        }
      } catch {
        toast.error('Error inesperado.')
      } finally {
        setUploading(false)
      }
    },
    [entityType, entityId, media, onMediaChange]
  )

  const handleDelete = useCallback(
    async (mediaId: string) => {
      try {
        const result = await deleteMediaAction(mediaId)
        if (result.success) {
          const updated = media.filter((m) => m.id !== mediaId)
          setMedia(updated)
          onMediaChange?.(updated)
          toast.success('Imagen eliminada.')
        } else {
          toast.error(result.error ?? 'Error al eliminar.')
        }
      } catch {
        toast.error('Error inesperado.')
      }
    },
    [media, onMediaChange]
  )

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return
    await handleUpload(urlInput.trim())
    setUrlInput('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Galería de fotos ({media.length}/20)
        </Label>
      </div>

      {/* URL input */}
      <form onSubmit={handleUrlSubmit} className="flex gap-2">
        <Input
          placeholder="URL de imagen (https://...)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="text-sm"
        />
        <Button type="submit" variant="secondary" disabled={uploading || !urlInput.trim()}>
          {uploading ? 'Subiendo...' : 'Agregar'}
        </Button>
      </form>

      {/* Media grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {media.map((item, index) => (
            <div
              key={item.id}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={item.url}
                alt={item.alt ?? `Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index === 0 && (
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    Portada
                  </span>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => handleDelete(item.id)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {media.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg border-dashed">
          No hay fotos. Agrega una URL de imagen arriba.
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        La primera imagen será la portada. Máximo 20 imágenes, 15MB cada una.
      </p>
    </div>
  )
}
