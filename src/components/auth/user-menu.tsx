'use client'

import { useRef, useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { motion, AnimatePresence, cubicBezier, type Transition } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iosSpring: Transition = { type: 'spring', stiffness: 400, damping: 30 }

const menuVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -6 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit:   { opacity: 0, scale: 0.95, y: -6 },
}

const iosEase = cubicBezier(0.16, 1, 0.3, 1)

const itemVariants = {
  hidden:  { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.045, duration: 0.2, ease: iosEase },
  }),
}

type MenuItem = {
  href?: string
  label: string
  icon: React.ElementType
  onClick?: () => void
  danger?: boolean
  adminOnly?: boolean
}

export function UserMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  if (status === 'loading') {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link href="/auth/signin">Iniciar sesión</Link>
        </Button>
        <Button asChild size="sm" className="h-8">
          <Link href="/auth/signup">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Registrarse
          </Link>
        </Button>
      </div>
    )
  }

  const menuItems: MenuItem[] = [
    { href: '/dashboard',                  label: 'Dashboard',      icon: LayoutDashboard },
    { href: '/dashboard/notificaciones',   label: 'Notificaciones', icon: Bell },
    { href: '/dashboard/configuracion',    label: 'Configuración',  icon: Settings },
    { href: '/admin',                      label: 'Panel Admin',    icon: ShieldCheck, adminOnly: true },
    {
      label: 'Cerrar sesión',
      icon: LogOut,
      danger: true,
      onClick: () => signOut({ callbackUrl: '/' }),
    },
  ]

  const visibleItems = menuItems.filter(
    (item) => !item.adminOnly || session.user?.role === 'ADMIN'
  )

  const initials = session.user?.name?.charAt(0).toUpperCase() ?? 'U'

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.92 }}
        transition={iosSpring}
        className="relative flex h-8 w-8 items-center justify-center rounded-full outline-none ring-2 ring-transparent transition-all focus-visible:ring-primary/40"
        aria-label="Menú de usuario"
        aria-expanded={open}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={session.user?.image ?? ''} alt={session.user?.name ?? ''} />
          <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
        {/* Online dot */}
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-background bg-emerald-500" />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="user-menu"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 origin-top-right overflow-hidden rounded-2xl border border-border/60 bg-popover shadow-xl"
          >
            {/* User info header */}
            <motion.div
              custom={0}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={session.user?.image ?? ''} alt={session.user?.name ?? ''} />
                <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                {session.user?.name && (
                  <p className="truncate text-sm font-semibold text-foreground">
                    {session.user.name}
                  </p>
                )}
                {session.user?.email && (
                  <p className="truncate text-xs text-muted-foreground">
                    {session.user.email}
                  </p>
                )}
              </div>
            </motion.div>

            <div className="mx-3 h-px bg-border/60" />

            {/* Menu items */}
            <div className="p-1.5">
              {visibleItems.map((item, i) => {
                const Icon = item.icon
                const isLastBeforeDanger = i === visibleItems.length - 2 && item.danger !== true && visibleItems[i + 1]?.danger
                return (
                  <div key={item.label}>
                    {isLastBeforeDanger && <div className="mx-1 my-1 h-px bg-border/60" />}
                    <motion.div
                      custom={i + 1}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {item.href ? (
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                            item.danger
                              ? 'text-destructive hover:bg-destructive/10'
                              : 'text-foreground hover:bg-accent'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 opacity-70" />
                          {item.label}
                        </Link>
                      ) : (
                        <button
                          onClick={() => { setOpen(false); item.onClick?.() }}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                            item.danger
                              ? 'text-destructive hover:bg-destructive/10'
                              : 'text-foreground hover:bg-accent'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 opacity-70" />
                          {item.label}
                        </button>
                      )}
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
