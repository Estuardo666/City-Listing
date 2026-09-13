'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface SkipButtonProps {
  onSkip: () => void
}

export function SkipButton({ onSkip }: SkipButtonProps) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="min-h-11 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Cancelar
        </button>
        <button
          onClick={onSkip}
          className="min-h-11 rounded-lg bg-destructive/10 px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Saltar
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-[transform,color,background-color] duration-150 active:scale-[0.97] hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      Saltar por ahora
      <X className="h-3.5 w-3.5" />
    </button>
  )
}
