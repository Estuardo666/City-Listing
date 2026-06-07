'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { uploadMediaAction, deleteMediaAction } from '@/actions/media'
import { setCoverImageAction, setLogoAction, removeCoverImageAction, removeLogoAction, reorderMediaAction } from '@/actions/media/manage-media'
import { Image, Upload, X, GripVertical, Check } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface MediaItem {
  id: string
  url: string
  alt: string | null
  type: string
  order: number
}

interface MediaManagerProps {
  venueId: string
  initialMedia?: MediaItem[]
  currentCover?: string | null
  currentLogo?: string | null
}

export function MediaManager({ venueId, initialMedia = [], currentCover, currentLogo }: MediaManagerProps) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia)
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleUpload = useCallback(
    async (url: string, alt?: string) => {
      setUploading(true)
      try {
        const result = await uploadMediaAction('venue', venueId, {
          url,
          alt: alt ?? null,
          type: 'IMAGE',
        })

        if (result.success && result.data) {
          const updated = [...media, result.data].sort((a, b) => a.order - b.order)
          setMedia(updated)
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
    [venueId, media]
  )

  const handleDelete = useCallback(
    async (mediaId: string) => {
      try {
        const result = await deleteMediaAction(mediaId)
        if (result.success) {
          const updated = media.filter((m) => m.id !== mediaId)
          setMedia(updated)
          toast.success('Imagen eliminada.')
        } else {
          toast.error(result.error ?? 'Error al eliminar.')
        }
      } catch {
        toast.error('Error inesperado.')
      }
      setDeleteConfirm(null)
    },
    [media]
  )

  const handleSetCover = useCallback(
    async (imageUrl: string) => {
      try {
        const result = await setCoverImageAction(venueId, imageUrl)
        if (result.success) {
          toast.success('Imagen de portada establecida.')
        } else {
          toast.error(result.error ?? 'Error al establecer portada.')
        }
      } catch {
        toast.error('Error inesperado.')
      }
    },
    [venueId]
  )

  const handleSetLogo = useCallback(
    async (imageUrl: string) => {
      try {
        const result = await setLogoAction(venueId, imageUrl)
        if (result.success) {
          toast.success('Logo establecido.')
        } else {
          toast.error(result.error ?? 'Error al establecer logo.')
        }
      } catch {
        toast.error('Error inesperado.')
      }
    },
    [venueId]
  )

  const handleRemoveCover = useCallback(async () => {
    try {
      const result = await removeCoverImageAction(venueId)
      if (result.success) {
        toast.success('Imagen de portada removida.')
      } else {
        toast.error(result.error ?? 'Error al remover portada.')
      }
    } catch {
      toast.error('Error inesperado.')
    }
  }, [venueId])

  const handleRemoveLogo = useCallback(async () => {
    try {
      const result = await removeLogoAction(venueId)
      if (result.success) {
        toast.success('Logo removido.')
      } else {
        toast.error(result.error ?? 'Error al remover logo.')
      }
    } catch {
      toast.error('Error inesperado.')
    }
  }, [venueId])

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newMedia = [...media]
    const [removed] = newMedia.splice(draggedIndex, 1)
    newMedia.splice(dragOverIndex, 0, removed)

    const reordered = newMedia.map((item, index) => ({ ...item, order: index }))
    setMedia(reordered)
    setDraggedIndex(null)
    setDragOverIndex(null)

    const mediaIds = reordered.map((item) => item.id)
    await reorderMediaAction(venueId, mediaIds)
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return
    await handleUpload(urlInput.trim())
    setUrlInput('')
  }

  return (
    <div className="space-y-6">
      {/* Cover Image Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Imagen de Portada</Label>
        {currentCover ? (
          <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
            <img src={currentCover} alt="Portada" className="w-full h-full object-cover" />
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={handleRemoveCover}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="aspect-video rounded-lg border-2 border-dashed border-border/60 bg-muted/50 flex items-center justify-center">
            <div className="text-center">
              <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No hay imagen de portada</p>
            </div>
          </div>
        )}
      </div>

      {/* Logo Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Logo</Label>
        {currentLogo ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-muted">
            <img src={currentLogo} alt="Logo" className="w-full h-full object-cover" />
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={handleRemoveLogo}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border/60 bg-muted/50 flex items-center justify-center">
            <div className="text-center">
              <Image className="h-6 w-6 mx-auto mb-1 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">Sin logo</p>
            </div>
          </div>
        )}
      </div>

      {/* Media Gallery Section */}
      <div className="space-y-3">
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
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-move ${
                  dragOverIndex === index ? 'ring-2 ring-primary' : ''
                }`}
              >
                <img
                  src={item.url}
                  alt={item.alt ?? `Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <div className="absolute top-2 left-2">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  {currentCover === item.url && (
                    <span className="absolute top-2 right-2 text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Portada
                    </span>
                  )}
                  {currentLogo === item.url && (
                    <span className="absolute top-2 right-2 text-[10px] font-medium bg-emerald-600 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Logo
                    </span>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetCover(item.url)
                      }}
                    >
                      Portada
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetLogo(item.url)
                      }}
                    >
                      Logo
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(item.id)
                    }}
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
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>No hay fotos. Agrega una URL de imagen arriba.</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Arrastra las imágenes para reordenarlas. Máximo 20 imágenes, 15MB cada una.
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La imagen será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
