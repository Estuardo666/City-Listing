'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Compass, MapPin, Heart, Sparkles } from 'lucide-react'
import type { getOnboardingVenueCategories } from '@/lib/queries/onboarding'

type Category = Awaited<ReturnType<typeof getOnboardingVenueCategories>>[number]

interface FollowingVenueData {
  id: string
  name: string
  slug: string
  image: string | null
  avgRating: number | null
  reviewCount: number
  venueCategories: {
    category: { id: string; name: string; icon: string | null }
  }[]
}

interface WelcomeStepProps {
  interests: Category[]
  followingVenues: FollowingVenueData[]
  totalPoints: number
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 22 },
  },
} as const

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 800
    const steps = 20
    const increment = value / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplay(value)
        clearInterval(interval)
      } else {
        setDisplay(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(interval)
  }, [value])

  return <span>{display}</span>
}

function FloatingEmoji({ emoji, delay }: { emoji: string; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [-20, -60, -100, -140],
        x: [0, Math.random() * 30 - 15, Math.random() * 40 - 20],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        repeatDelay: 2,
      }}
      className="pointer-events-none absolute text-xl"
      style={{
        left: `${Math.random() * 80 + 10}%`,
        bottom: '10%',
      }}
    >
      {emoji}
    </motion.span>
  )
}

export function WelcomeStep({ interests, followingVenues, totalPoints }: WelcomeStepProps) {
  const emojis = ['🎉', '🧭', '⭐', '🎊', '💫', '✨']

  return (
    <div className="relative flex flex-col items-center">
      {/* Floating emojis */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {emojis.map((emoji, i) => (
          <FloatingEmoji key={i} emoji={emoji} delay={i * 0.4} />
        ))}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center gap-6 text-center"
      >
        {/* Badge */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.6, delay: 0.8, ease: 'easeInOut' }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-[0_0_40px_hsl(var(--primary)/0.2)]"
          >
            <Compass className="h-10 w-10 text-primary" />
          </motion.div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Has desbloqueado</p>
            <p className="text-xl font-bold text-foreground">🧭 Explorador Nivel 1</p>
          </div>
        </motion.div>

        {/* Points */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-6 py-3"
        >
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span className="text-lg font-bold text-foreground">+<AnimatedCounter value={totalPoints} /> puntos</span>
        </motion.div>

        {/* Summary cards */}
        <motion.div variants={itemVariants} className="grid w-full max-w-sm grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/50 bg-card p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-primary">
              <MapPin className="h-4 w-4" />
              <span className="text-2xl font-bold">{interests.length}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">intereses</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-rose-500">
              <Heart className="h-4 w-4" />
              <span className="text-2xl font-bold">{followingVenues.length}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">lugares seguidos</p>
          </div>
        </motion.div>

        {/* Interest chips */}
        {interests.length > 0 && (
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2">
            {interests.slice(0, 6).map((interest) => (
              <span
                key={interest.id}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {interest.icon} {interest.name}
              </span>
            ))}
            {interests.length > 6 && (
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                +{interests.length - 6} más
              </span>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
