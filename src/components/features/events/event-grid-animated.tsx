'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { EventListItem } from '@/types/event'
import { EventCard } from './event-card'

type EventGridAnimatedProps = {
  events: EventListItem[]
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

export function EventGridAnimated({ events }: EventGridAnimatedProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        variants={container}
        initial="hidden"
        animate="show"
        key={events.length} // Force reanimation when events change
      >
        {events.map((event) => (
          <motion.div
            key={event.id}
            variants={item}
            layout
          >
            <EventCard event={event} />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
