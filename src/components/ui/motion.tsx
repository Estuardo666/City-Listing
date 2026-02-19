'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MotionProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
}

export const MotionDiv = ({ children, className, ...props }: MotionProps) => (
  <motion.div className={cn(className)} {...props}>
    {children}
  </motion.div>
)

export const MotionCard = ({ children, className, ...props }: MotionProps) => (
  <motion.div
    className={cn(
      'rounded-2xl border border-border/60 bg-card text-card-foreground',
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
)

// iOS-style spring — cubic-bezier(0.16, 1, 0.3, 1) matches UIKit spring feel
const iosSpring = [0.16, 1, 0.3, 1] as const

export const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: iosSpring },
} as const

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4, ease: iosSpring },
} as const

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.45, ease: iosSpring },
} as const

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: iosSpring },
} as const

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
} as const

export const viewportOnce = {
  once: true,
  margin: '-6% 0px -6% 0px',
}
