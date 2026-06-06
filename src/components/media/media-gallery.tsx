'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

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

  return (
    <>
      <div className={`grid gap-2 ${className} ${
        sorted.length === 1
          ? 'grid-cols-1'
          : sorted.length === 2
          ? 'grid-cols-2'
          : 'grid-cols-2 md:grid-cols-3'
      }`}>
        {sorted.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setSelectedIndex(index)}
            className={`relative overflow-hidden rounded-lg aspect-[4/3] group ${
              index === 0 && sorted.length > 1 ? 'col-span-2 row-span-2' : ''
            }`}
          >
            <img
              src={item.url}
              alt={item.alt ?? `Foto ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedIndex(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedIndex(null)}
          >
            <X className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <img
            src={sorted[selectedIndex].url}
            alt={sorted[selectedIndex].alt ?? `Foto ${selectedIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
          >
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
