'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { VenueListItem } from '@/types/venue'
import { VenueCard } from './venue-card'

type VenueGridAnimatedProps = {
  venues: VenueListItem[]
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn" as const
    }
  }
}

export function VenueGridAnimated({ venues }: VenueGridAnimatedProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        variants={container}
        initial="hidden"
        animate="show"
        key={venues.length} // Force reanimation when venues change
      >
        {venues.map((venue) => (
          <motion.div
            key={venue.id}
            variants={item}
            layout
          >
            <VenueCard venue={venue} />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
