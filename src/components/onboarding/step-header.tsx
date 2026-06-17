'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface StepHeaderProps {
  title: string
  subtitle: string
  stepKey: string
}

export function StepHeader({ title, subtitle, stepKey }: StepHeaderProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-2"
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      </motion.div>
    </AnimatePresence>
  )
}
