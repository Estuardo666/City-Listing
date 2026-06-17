'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  hidden: { opacity: 0, scale: 0.9, y: 16 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 350, damping: 22 },
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
            key={cat.id}
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            animate={{
              borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border) / 0.5)',
              backgroundColor: isSelected ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => onToggle(cat.id)}
            className={cn(
              'relative flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-shadow',
              isSelected
                ? 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.2)]'
                : 'border-border/50 hover:border-primary/30 hover:shadow-md'
            )}
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </motion.div>
            )}
            <span className="text-2xl">{cat.icon ?? '📍'}</span>
            <span className={cn(
              'line-clamp-2 text-xs font-semibold leading-tight',
              isSelected ? 'text-primary' : 'text-foreground'
            )}>
              {cat.name}
            </span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
