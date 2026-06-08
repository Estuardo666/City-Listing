'use client'

import type { VenueService } from '@prisma/client'

interface ServicesDisplayProps {
  services: VenueService[]
  className?: string
}

export function ServicesDisplay({ services, className = '' }: ServicesDisplayProps) {
  const activeServices = services.filter((s) => s.isActive)
  if (activeServices.length === 0) return null

  return (
    <div className={className}>
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">Servicios</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {activeServices.map((s) => (
          <div
            key={s.id}
            className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-3 text-center transition-colors hover:bg-accent"
          >
            <span className="text-2xl">{s.icon ?? '✨'}</span>
            <span className="text-xs font-medium text-foreground">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
