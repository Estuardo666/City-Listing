'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2, CheckCircle2, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { createCheckInAction } from '@/actions/checkins'
import { Input } from '@/components/ui/input'

interface CheckInButtonProps {
  venueId: string
  venueName: string
  venueLat: number | null
  venueLng: number | null
}

export function CheckInButton({ venueId, venueName, venueLat, venueLng }: CheckInButtonProps) {
  const [loading, setLoading] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)

  async function handleCheckIn() {
    setLoading(true)
    try {
      if (!navigator.geolocation) {
        toast.error('Tu navegador no soporta geolocalización.')
        setLoading(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const result = await createCheckInAction({
            venueId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            note: note || null,
          })

          if (result.success) {
            setCheckedIn(true)
            toast.success(`¡Check-in en ${venueName}!`)
          } else {
            toast.error(result.error ?? 'Error al hacer check-in.')
          }
          setLoading(false)
        },
        (err) => {
          toast.error('No se pudo obtener tu ubicación. Activa el GPS.')
          setLoading(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    } catch {
      toast.error('Error inesperado.')
      setLoading(false)
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
        <Button onClick={handleCheckIn} disabled={loading} className="flex-1 gap-2">
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Ubicando...</>
          ) : (
            <><MapPin className="h-4 w-4" /> Check-in</>
          )}
        </Button>
        <Button variant="outline" size="icon" onClick={() => setShowNote(!showNote)} aria-label="Agregar nota">
          <Camera className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">Debes estar a menos de 200m del local</p>
    </div>
  )
}
