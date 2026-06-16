'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'
import { CheckInLightbox } from './checkin-lightbox'
import type { CheckInWithUser, CheckInPhoto } from '@/types/checkin'

interface CheckInsSectionProps {
  checkIns: CheckInWithUser[]
}

const PHOTOS_PER_PAGE = 12

export function CheckInsSection({ checkIns }: CheckInsSectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const photoCheckIns: CheckInPhoto[] = checkIns.filter(
    (c): c is CheckInPhoto => c.photoUrl !== null
  )
  const totalPages = Math.ceil(photoCheckIns.length / PHOTOS_PER_PAGE)
  const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE
  const currentPhotos = photoCheckIns.slice(startIndex, startIndex + PHOTOS_PER_PAGE)

  if (photoCheckIns.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" /> Check In&apos;s
        </h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 py-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
            <Camera className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Sé el primero en compartir una foto de tu visita
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" /> Check In&apos;s
          <span className="text-sm font-normal text-muted-foreground">({photoCheckIns.length})</span>
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {currentPhotos.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setLightboxIndex(startIndex + index)}
              className="relative aspect-square overflow-hidden rounded-xl group cursor-pointer"
            >
              <img
                src={item.photoUrl}
                alt={`Check-in de ${item.user.name ?? 'Usuario'}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs font-medium text-white truncate">
                  {item.user.name ?? 'Usuario'}
                </p>
              </div>
            </button>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <CheckInLightbox
          photos={photoCheckIns}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
