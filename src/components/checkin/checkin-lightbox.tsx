'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, Camera } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { CheckInPhoto } from '@/types/checkin'

interface CheckInLightboxProps {
  photos: CheckInPhoto[]
  initialIndex: number
  onClose: () => void
}

export function CheckInLightbox({ photos, initialIndex, onClose }: CheckInLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const current = photos[currentIndex]

  const handlePrev = useCallback(() => {
    setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : photos.length - 1)
  }, [currentIndex, photos.length])

  const handleNext = useCallback(() => {
    setCurrentIndex(currentIndex < photos.length - 1 ? currentIndex + 1 : 0)
  }, [currentIndex, photos.length])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    },
    [onClose, handlePrev, handleNext]
  )

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Cerrar"
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
        aria-label="Anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <div
        className="max-h-[90vh] max-w-[90vw] flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-h-[70vh] max-w-[85vw]">
          <Image
            src={current.photoUrl}
            alt={`Check-in de ${current.user.name ?? 'Usuario'}`}
            width={1200}
            height={900}
            className="max-h-[70vh] w-auto object-contain rounded-lg"
            sizes="(max-width: 768px) 90vw, 70vw"
          />
        </div>

        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md rounded-xl px-5 py-3 max-w-[90vw]">
          {current.user.image ? (
            <Image
              src={current.user.image}
              alt={current.user.name ?? 'Usuario'}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white font-semibold">
              {current.user.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">
              {current.user.name ?? 'Usuario'}
            </p>
            <p className="text-xs text-white/70">
              {formatDateTime(current.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-white/70 text-sm">
          <Camera className="h-4 w-4" />
          <span>
            {currentIndex + 1} / {photos.length}
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation()
          handleNext()
        }}
        aria-label="Siguiente"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  )
}
