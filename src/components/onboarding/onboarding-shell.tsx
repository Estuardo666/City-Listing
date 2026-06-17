'use client'

import { motion } from 'framer-motion'

interface OnboardingShellProps {
  children: React.ReactNode
  header: React.ReactNode
}

export function OnboardingShell({ children, header }: OnboardingShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10" />
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.04), transparent 70%)',
              'radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.06), transparent 70%)',
              'radial-gradient(circle at 50% 80%, hsl(var(--primary) / 0.04), transparent 70%)',
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute inset-0"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-border/30 px-4 py-3 sm:px-6">
        {header}
      </header>

      {/* Content */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
