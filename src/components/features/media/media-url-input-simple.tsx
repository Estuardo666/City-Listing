'use client'

import { type ChangeEvent, useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type UploadMediaApiResponse = {
  success: boolean
  data?: {
    key: string
    url: string
  }
  error?: string
}

type MediaUrlInputSimpleProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  description?: string
}

export function MediaUrlInputSimple({
  label,
  value,
  onChange,
  placeholder,
  description,
}: MediaUrlInputSimpleProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleSelectFile = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    setIsUploading(true)

    try {
      const payload = new FormData()
      payload.append('file', selectedFile)

      const response = await fetch('/api/uploads/media', {
        method: 'POST',
        body: payload,
      })

      const result = (await response.json()) as UploadMediaApiResponse

      if (!response.ok || !result.success || !result.data?.url) {
        toast.error(result.error ?? 'No se pudo subir el archivo')
        return
      }

      onChange(result.data.url)
      toast.success('Archivo subido correctamente')
    } catch {
      toast.error('No se pudo subir el archivo')
    } finally {
      event.target.value = ''
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between gap-2">
          <Label>{label}</Label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSelectFile}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isUploading ? 'Subiendo...' : 'Subir archivo'}
          </Button>
        </div>
      )}

      {!label && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSelectFile}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isUploading ? 'Subiendo...' : 'Subir archivo'}
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleFileChange}
      />

      <Input
        placeholder={placeholder ?? 'https://...'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
