'use client'

import { motion } from 'framer-motion'

interface ProgressDotsProps {
  currentStep: number
  totalSteps: number
}

export function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-label="Progreso de configuración" aria-valuemin={1} aria-valuemax={totalSteps} aria-valuenow={currentStep + 1}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === currentStep ? 24 : 8,
            backgroundColor:
              i <= currentStep
                ? 'hsl(var(--primary))'
                : 'hsl(var(--muted))',
          }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="h-2 rounded-full"
        />
      ))}
      <span className="ml-2 text-xs font-medium text-muted-foreground">
        Paso {currentStep + 1} de {totalSteps}
      </span>
    </div>
  )
}
