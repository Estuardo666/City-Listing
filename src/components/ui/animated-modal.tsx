'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Animation variants ────────────────────────────────────────────
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
}

const contentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 28,
      stiffness: 350,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
}

// ── AnimatedModal component ───────────────────────────────────────
interface AnimatedModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function AnimatedModal({ open, onClose, children, className }: AnimatedModalProps) {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Content */}
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'relative z-10 max-h-[90vh] w-full overflow-y-auto',
              'rounded-2xl border border-border/60 bg-card shadow-2xl',
              className,
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
