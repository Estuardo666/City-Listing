import { MapPin } from 'lucide-react'
import { transportProviders } from '@/lib/transport'
import { TransportButton } from './transport-button'

type GettingThereSectionProps = {
  latitude: number
  longitude: number
  name: string
}

export function GettingThereSection({
  latitude,
  longitude,
  name,
}: GettingThereSectionProps) {
  const availableProviders = transportProviders.filter((provider) =>
    provider.isAvailable({ latitude, longitude })
  )

  if (availableProviders.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
        <MapPin className="h-4 w-4" />
        Cómo Llegar
      </h3>
      <div className="mt-3 flex gap-3">
        {availableProviders.map((provider) => (
          <TransportButton
            key={provider.id}
            provider={provider}
            latitude={latitude}
            longitude={longitude}
            name={name}
          />
        ))}
      </div>
    </div>
  )
}
