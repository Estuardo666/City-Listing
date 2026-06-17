'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Star, MapPin, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { getRecommendedVenuesForOnboarding } from '@/lib/queries/onboarding'

type Venue = Awaited<ReturnType<typeof getRecommendedVenuesForOnboarding>>[number]

interface VenuesStepProps {
  venues: Venue[]
  followed: string[]
  onFollow: (venueId: string) => void
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
} as const

function VenueImage({ venue }: { venue: Venue }) {
  const [imgError, setImgError] = useState(false)
  const firstCategory = venue.venueCategories[0]?.category

  if (!venue.image || imgError) {
    return (
      <div className={cn(
        'flex h-full w-full items-center justify-center',
        'bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20'
      )}>
        <span className="text-3xl">{firstCategory?.icon ?? '📍'}</span>
      </div>
    )
  }

  return (
    <img
      src={venue.image}
      alt={venue.name}
      className="h-full w-full object-cover"
      onError={() => setImgError(true)}
    />
  )
}

export function VenuesStep({ venues, followed, onFollow }: VenuesStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {venues.map((venue) => {
        const isFollowed = followed.includes(venue.id)
        const firstCategory = venue.venueCategories[0]?.category

        return (
          <motion.div
            key={venue.id}
            variants={itemVariants}
            className="group relative flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-3 transition-shadow hover:shadow-md"
          >
            {/* Image */}
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
              <VenueImage venue={venue} />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{venue.name}</p>
              {firstCategory && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{firstCategory.icon}</span>
                  {firstCategory.name}
                </p>
              )}
              {venue.avgRating != null && (
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium text-foreground">
                    {venue.avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({venue.reviewCount})
                  </span>
                </div>
              )}
            </div>

            {/* Follow button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onFollow(venue.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                isFollowed
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isFollowed ? (
                  <motion.span
                    key="following"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Siguiendo
                  </motion.span>
                ) : (
                  <motion.span
                    key="follow"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center gap-1"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    Seguir
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
