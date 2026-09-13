'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DiscoveryIcon } from '@/components/onboarding/discovery-icon'
import type { getOnboardingVenueCategories } from '@/lib/queries/onboarding'

type Category = Awaited<ReturnType<typeof getOnboardingVenueCategories>>[number]

interface InterestsStepProps {
  categories: Category[]
  selected: string[]
  onToggle: (categoryId: string) => void
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.035, delayChildren: 0.1 },
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

export function InterestsStep({ categories, selected, onToggle }: InterestsStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
    >
      {categories.map((cat) => {
        const isSelected = selected.includes(cat.id)
        return (
          <motion.button
            type="button"
            key={cat.id}
            variants={itemVariants}
            whileTap={{ scale: 0.97 }}
            onClick={() => onToggle(cat.id)}
            aria-pressed={isSelected}
            className={cn(
              'relative flex min-h-28 flex-col items-start justify-between rounded-2xl border p-4 text-left transition-[transform,border-color,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isSelected
                ? 'border-primary bg-primary/[0.07]'
                : 'border-border/70 bg-card hover:border-primary/40'
            )}
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </motion.div>
            )}
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground')}>
              <DiscoveryIcon category={cat} />
            </span>
            <span className={cn(
              'line-clamp-2 pr-5 text-sm font-semibold leading-tight text-foreground'
            )}>
              {cat.name}
            </span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
