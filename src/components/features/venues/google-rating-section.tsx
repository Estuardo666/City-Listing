'use client'

import { Star } from 'lucide-react'
import { googlePlaceUrl } from '@/lib/google/freshness'

interface GoogleRatingSectionProps {
  googleRating: number | null
  googleReviewCount: number
  /** Null when the cached Google data is past its 30-day limit; the block is then hidden. */
  googlePlaceId: string | null
  avgRating: number | null
  reviewCount: number
}

export function GoogleRatingSection({
  googleRating,
  googleReviewCount,
  googlePlaceId,
  avgRating,
  reviewCount,
}: GoogleRatingSectionProps) {
  const hasGoogle = googleRating !== null && googleRating > 0 && googlePlaceId !== null
  const hasViveLoja = reviewCount > 0 && avgRating !== null

  if (!hasGoogle && !hasViveLoja) return null

  return (
    <div className="flex flex-wrap gap-4">
      {/* Google's terms require content sourced from Places to link back to
          the place on Google Maps. */}
      {hasGoogle && (
        <a
          href={googlePlaceUrl(googlePlaceId!)}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 transition-colors hover:bg-blue-100"
        >
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= Math.round(googleRating!)
                    ? 'fill-blue-500 text-blue-500'
                    : 'fill-blue-200 text-blue-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-blue-700">{googleRating!.toFixed(1)}</span>
          <span className="text-xs text-blue-600">en Google ({googleReviewCount})</span>
        </a>
      )}

      {hasViveLoja && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= Math.round(avgRating!)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-amber-200 text-amber-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-amber-700">{avgRating!.toFixed(1)}</span>
          <span className="text-xs text-amber-600">ViveLoja ({reviewCount})</span>
        </div>
      )}
    </div>
  )
}
