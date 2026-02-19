'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'theme'

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>('light')

  useEffect(() => {
    const initialTheme = getInitialTheme()
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')

    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return

      const nextTheme = event.newValue === 'dark' ? 'dark' : 'light'
      setTheme(nextTheme)
      document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn('relative h-9 w-9 overflow-hidden rounded-full border-border/60', className)}
      aria-label="Cambiar tema"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute"
          >
            <Moon className="h-4 w-4" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute"
          >
            <Sun className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  )
}
