'use client'

import { useState, useCallback } from 'react'
import { Search, Loader2, MapPin, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPreview } from './map-preview'
import type { LogEntry } from './log-feed'
import { createLog } from './log-feed'

export interface GeoResult {
  placeId: string
  name: string
  formattedAddress: string
  lat: number
  lng: number
}

interface WizardAddressProps {
  onResolved: (result: GeoResult) => void
  onAddLog: (log: LogEntry) => void
}

export function WizardAddress({ onResolved, onAddLog }: WizardAddressProps) {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeoResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!address.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    onAddLog(createLog('info', `Buscando dirección: "${address}"`))

    try {
      const res = await fetch(
        `/api/admin/imports/google/geocode?address=${encodeURIComponent(address)}`
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al buscar dirección')
      }

      const data = await res.json()
      const geo = data.data as GeoResult

      setResult(geo)
      onAddLog(
        createLog(
          'success',
          `Dirección encontrada: ${geo.formattedAddress} → (${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)})`
        )
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      onAddLog(createLog('error', msg))
    } finally {
      setLoading(false)
    }
  }, [address, onAddLog])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">Dirección o lugar</Label>
        <div className="flex gap-2">
          <Input
            id="address"
            placeholder='Ej: "Loja, Ecuador" o "Av. Universitaria, Loja"'
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button onClick={handleSearch} disabled={loading || !address.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {result && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-green-800">{result.name}</p>
              <p className="text-sm text-green-700">{result.formattedAddress}</p>
              <p className="text-xs text-green-600 font-mono mt-1">
                {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
              </p>
            </div>
          </div>

          <MapPreview lat={result.lat} lng={result.lng} radius={5000} />

          <Button onClick={() => onResolved(result)} className="w-full">
            <MapPin className="h-4 w-4 mr-2" />
            Confirmar ubicación
          </Button>
        </div>
      )}
    </div>
  )
}
