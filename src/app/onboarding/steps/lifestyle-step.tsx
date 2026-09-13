'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LIFESTYLE_OPTIONS } from '@/lib/constants/onboarding'
import { Check } from 'lucide-react'
import { DiscoveryIcon } from '@/components/onboarding/discovery-icon'

interface LifestyleStepProps {
  selected: string[]
  onToggle: (preference: string) => void
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
  },
} as const

export function LifestyleStep({ selected, onToggle }: LifestyleStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {LIFESTYLE_OPTIONS.map((opt) => {
        const isSelected = selected.includes(opt.id)
        return (
          <motion.button
            type="button"
            key={opt.id}
            variants={itemVariants}
            whileTap={{ scale: 0.97 }}
            onClick={() => onToggle(opt.id)}
            aria-pressed={isSelected}
            className={cn(
              'relative flex min-h-36 flex-col items-start justify-between rounded-2xl border p-4 text-left transition-[transform,border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-5',
              isSelected
                ? 'border-primary bg-primary/[0.07]'
                : 'border-border/70 bg-card hover:border-primary/40'
            )}
          >
            <div className="flex w-full items-start justify-between gap-3">
              <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground')}>
                <DiscoveryIcon lifestyleIcon={opt.icon} />
              </span>
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent')}>
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            </div>
            <span>
              <span className="block text-sm font-semibold leading-tight text-foreground">{opt.label}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{opt.description}</span>
            </span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
