'use client'

import { type ChangeEvent, useRef, useState, useCallback } from 'react'
import { Loader2, Upload, X, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type UploadMediaApiResponse = {
  success: boolean
  data?: { key: string; url: string }
  error?: string
}

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Máximo 5MB')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/uploads/media', { method: 'POST', body: formData })
      const result = (await response.json()) as UploadMediaApiResponse
      if (!response.ok || !result.success || !result.data?.url) {
        toast.error(result.error ?? 'Error al subir')
        return
      }
      onChange(result.data.url)
      toast.success('Imagen subida')
    } catch {
      toast.error('Error al subir')
    } finally {
      setIsUploading(false)
    }
  }, [onChange])

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    e.target.value = ''
  }, [handleUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  if (value && value.startsWith('http')) {
    return (
      <div className={cn('relative overflow-hidden rounded-lg border border-border/50', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Preview" className="h-32 w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[10px] text-white/90 hover:text-white underline"
          >
            Cambiar
          </button>
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border/60 hover:border-primary/40 hover:bg-muted/30',
        isUploading && 'pointer-events-none opacity-60',
        className
      )}
    >
      {isUploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
      )}
      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground">
          {isUploading ? 'Subiendo...' : 'Arrastra una imagen o haz clic'}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">JPG, PNG, WebP · Máx 5MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
