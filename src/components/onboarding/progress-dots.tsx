'use client'

import { motion } from 'framer-motion'

interface ProgressDotsProps {
  currentStep: number
  totalSteps: number
}

export function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: i === currentStep ? 1.2 : 1,
            width: i === currentStep ? 28 : 10,
            backgroundColor:
              i <= currentStep
                ? 'hsl(var(--primary))'
                : 'hsl(var(--muted))',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="h-2.5 rounded-full"
        />
      ))}
      <span className="ml-2 text-xs font-medium text-muted-foreground">
        {currentStep + 1}/{totalSteps}
      </span>
    </div>
  )
}
