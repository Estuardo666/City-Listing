'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LIFESTYLE_OPTIONS } from '@/lib/constants/onboarding'

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
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 320, damping: 22 },
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
            key={opt.id}
            variants={itemVariants}
            layout
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.94 }}
            animate={{
              borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border) / 0.5)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => onToggle(opt.id)}
            className={cn(
              'relative flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-shadow sm:p-5',
              isSelected
                ? 'border-primary bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.15)]'
                : 'border-border/50 bg-card hover:border-primary/30 hover:shadow-md'
            )}
          >
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-xl',
              opt.color,
              isSelected ? 'shadow-lg' : 'opacity-80'
            )}>
              {opt.emoji}
            </div>
            <span className={cn(
              'text-xs font-semibold leading-tight sm:text-sm',
              isSelected ? 'text-primary' : 'text-foreground'
            )}>
              {opt.label}
            </span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
