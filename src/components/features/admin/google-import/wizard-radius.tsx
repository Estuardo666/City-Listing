'use client'

import { useState } from 'react'
import { Ruler, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MapPreview } from './map-preview'

const RADIUS_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
  { value: 50000, label: '50 km' },
]

interface WizardRadiusProps {
  lat: number
  lng: number
  initialRadius?: number
  onConfirm: (radius: number) => void
  onBack: () => void
}

export function WizardRadius({
  lat,
  lng,
  initialRadius = 5000,
  onConfirm,
  onBack,
}: WizardRadiusProps) {
  const [radius, setRadius] = useState(initialRadius)

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label>Radio de búsqueda</Label>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={radius === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRadius(opt.value)}
            >
              <Ruler className="h-3.5 w-3.5 mr-1.5" />
              {opt.label}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Se buscarán negocios en un radio de{' '}
          <strong>{radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}</strong> alrededor del
          punto seleccionado.
        </p>
      </div>

      <MapPreview lat={lat} lng={lng} radius={radius} />

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Atrás
        </Button>
        <Button onClick={() => onConfirm(radius)} className="flex-1">
          Confirmar radio
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
