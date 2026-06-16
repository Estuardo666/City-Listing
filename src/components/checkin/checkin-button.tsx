'use client'

import { useState, useRef, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2, CheckCircle2, Camera, X, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { createCheckInAction } from '@/actions/checkins'
import { Input } from '@/components/ui/input'

interface CheckInButtonProps {
  venueId: string
  venueName: string
  venueLat: number | null
  venueLng: number | null
}

type LoadingState = 'idle' | 'uploading' | 'locating' | 'checking'

export function CheckInButton({ venueId, venueName, venueLat, venueLng }: CheckInButtonProps) {
  const [loading, setLoading] = useState<LoadingState>('idle')
  const [checkedIn, setCheckedIn] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes.')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('La imagen no debe superar 15MB.')
      return
    }

    uploadPhoto(file)
  }

  async function uploadPhoto(file: File) {
    setLoading('uploading')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/uploads/media', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.data?.url) {
        setPhotoUrl(result.data.url)
        setPhotoPreview(URL.createObjectURL(file))
        toast.success('Foto cargada.')
      } else {
        toast.error(result.error ?? 'Error al subir la foto.')
      }
    } catch {
      toast.error('Error al subir la foto.')
    } finally {
      setLoading('idle')
    }
  }

  function removePhoto() {
    setPhotoUrl(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleCheckIn() {
    setLoading('locating')
    try {
      if (!navigator.geolocation) {
        toast.error('Tu navegador no soporta geolocalización.')
        setLoading('idle')
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLoading('checking')
          const result = await createCheckInAction({
            venueId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            note: note || null,
            photoUrl: photoUrl || null,
          })

          if (result.success) {
            setCheckedIn(true)
            toast.success(`¡Check-in en ${venueName}!`)
          } else {
            toast.error(result.error ?? 'Error al hacer check-in.')
          }
          setLoading('idle')
        },
        () => {
          toast.error('No se pudo obtener tu ubicación. Activa el GPS.')
          setLoading('idle')
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    } catch {
      toast.error('Error inesperado.')
      setLoading('idle')
    }
  }

  if (checkedIn) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
        <CheckCircle2 className="h-4 w-4" /> ¡Check-in realizado!
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {photoPreview && (
        <div className="relative w-full overflow-hidden rounded-lg border">
          <img src={photoPreview} alt="Preview" className="h-32 w-full object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1.5 right-1.5 h-6 w-6"
            onClick={removePhoto}
            aria-label="Quitar foto"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {showNote && (
        <Input
          placeholder="Nota (opcional)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          className="text-sm"
        />
      )}

      <div className="flex gap-2">
        <Button onClick={handleCheckIn} disabled={loading !== 'idle'} className="flex-1 gap-2">
          {loading === 'uploading' ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo foto...</>
          ) : loading === 'locating' ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Ubicando...</>
          ) : loading === 'checking' ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Haciendo check-in...</>
          ) : (
            <><MapPin className="h-4 w-4" /> Check-in</>
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading !== 'idle'}
          aria-label="Agregar foto"
        >
          <Camera className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowNote(!showNote)}
          disabled={loading !== 'idle'}
          aria-label="Agregar nota"
        >
          <StickyNote className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">Debes estar a menos de 200m del local</p>
    </div>
  )
}
