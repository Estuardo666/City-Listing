'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import { Compass, Search, X, Menu, ChevronRight } from 'lucide-react'
// X is used in mobile menu close button
import { UserMenu } from '@/components/auth/user-menu'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/explorar', label: 'Explorar' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/locales', label: 'Locales' },
  { href: '/blog', label: 'Blog' },
]

const iosSpring: Transition = { type: 'spring', stiffness: 400, damping: 30 }

export function SiteHeader() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const isAdminOrDashboard =
    pathname.startsWith('/admin') || pathname.startsWith('/dashboard')

  if (isAdminOrDashboard) return null

  return (
    <>
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-border/40 bg-background/80 shadow-sm backdrop-blur-2xl'
            : 'bg-transparent'
        )}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2 press-scale">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
              <Compass className="h-3.5 w-3.5" />
            </span>
            <span className="hidden text-sm font-semibold text-foreground sm:block">
              CityListing
            </span>
          </Link>

          {/* Divider */}
          <div className="hidden h-4 w-px bg-border sm:block" />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 sm:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150',
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-secondary"
                      transition={iosSpring}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Global search trigger (Ctrl+K) */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
            className="hidden items-center gap-2 rounded-lg border border-border/50 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:flex"
            aria-label="Búsqueda global"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Buscar…</span>
            <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>
          {/* Mobile search icon */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:hidden"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </button>

          <ThemeToggle className="inline-flex" />

          {/* User menu */}
          <UserMenu />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:hidden"
            aria-label="Menú"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileMenuOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <X className="h-4 w-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <Menu className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.header>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              key="mobile-nav"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-4 top-16 z-50 rounded-2xl border border-border/50 bg-card/95 p-3 shadow-xl backdrop-blur-2xl sm:hidden"
            >
              {NAV_LINKS.map((link, i) => {
                const active = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      {link.label}
                      <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                    </Link>
                  </motion.div>
                )
              })}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
