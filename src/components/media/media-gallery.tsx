'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, Play, Video } from 'lucide-react'

interface MediaItem {
  id: string
  url: string
  alt: string | null
  type: string
  order: number
}

interface MediaGalleryProps {
  media: MediaItem[]
  className?: string
}

export function MediaGallery({ media, className = '' }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (media.length === 0) return null

  const sorted = [...media].sort((a, b) => a.order - b.order)

  function handlePrev() {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : sorted.length - 1)
  }

  function handleNext() {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex < sorted.length - 1 ? selectedIndex + 1 : 0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setSelectedIndex(null)
    if (e.key === 'ArrowLeft') handlePrev()
    if (e.key === 'ArrowRight') handleNext()
  }

  return (
    <>
      <div className={`grid gap-2 ${className} ${
        sorted.length === 1 ? 'grid-cols-1' : sorted.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'
      }`}>
        {sorted.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setSelectedIndex(index)}
            className={`relative overflow-hidden rounded-lg aspect-[4/3] group ${
              index === 0 && sorted.length > 1 ? 'col-span-2 row-span-2' : ''
            }`}
            aria-label={`Ver ${item.type === 'VIDEO' ? 'video' : 'foto'} ${index + 1}`}
          >
            {item.type === 'VIDEO' ? (
              <>
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-5 w-5 text-foreground ml-0.5" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <Video className="h-4 w-4 text-white drop-shadow" />
                </div>
              </>
            ) : (
              <>
                <img
                  src={item.url}
                  alt={item.alt ?? `Foto ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </>
            )}
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedIndex(null)}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20" onClick={() => setSelectedIndex(null)} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="absolute left-4 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); handlePrev() }} aria-label="Anterior">
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            {sorted[selectedIndex].type === 'VIDEO' ? (
              <video
                src={sorted[selectedIndex].url}
                controls
                autoPlay
                className="max-h-[90vh] max-w-[90vw]"
              />
            ) : (
              <img
                src={sorted[selectedIndex].url}
                alt={sorted[selectedIndex].alt ?? `Foto ${selectedIndex + 1}`}
                className="max-h-[90vh] max-w-[90vw] object-contain"
              />
            )}
          </div>

          <Button variant="ghost" size="icon" className="absolute right-4 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); handleNext() }} aria-label="Siguiente">
            <ChevronRight className="h-6 w-6" />
          </Button>

          <div className="absolute bottom-4 text-white text-sm">
            {selectedIndex + 1} / {sorted.length}
          </div>
        </div>
      )}
    </>
  )
}
