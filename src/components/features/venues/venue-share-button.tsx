'use client'

import { Share2 } from 'lucide-react'

type VenueShareButtonProps = {
  name: string
}

export function VenueShareButton({ name }: VenueShareButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (navigator.share) {
          navigator.share({ title: name, url: window.location.href }).catch(() => undefined)
        } else {
          navigator.clipboard.writeText(window.location.href).catch(() => undefined)
        }
      }}
      className="flex items-center justify-center rounded-xl border border-border bg-card p-2.5 text-foreground transition-colors hover:bg-accent"
      aria-label="Compartir"
    >
      <Share2 className="h-4 w-4" />
    </button>
  )
}
