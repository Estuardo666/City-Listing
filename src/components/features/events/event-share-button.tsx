'use client'

import { Share2 } from 'lucide-react'

type EventShareButtonProps = {
  title: string
}

export function EventShareButton({ title }: EventShareButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (navigator.share) {
          navigator.share({ title, url: window.location.href }).catch(() => undefined)
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
