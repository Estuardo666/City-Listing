'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import {
  Compass,
  LayoutDashboard,
  Calendar,
  MapPin,
  Bell,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  FileText,
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const iosSpring: Transition = { type: 'spring', stiffness: 380, damping: 32 }

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  adminOnly?: boolean
}

const CREATE_NAV: NavItem[] = [
  { href: '/dashboard/eventos/crear', label: 'Crear Evento', icon: Calendar },
  { href: '/dashboard/locales/crear', label: 'Crear Local', icon: MapPin },
  { href: '/dashboard/blog/crear', label: 'Escribir Artículo', icon: FileText },
]

const MANAGE_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/eventos', label: 'Mis Eventos', icon: Calendar },
  { href: '/dashboard/locales', label: 'Mis Locales', icon: MapPin },
  { href: '/dashboard/blog', label: 'Mis Artículos', icon: FileText },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
]

const ADMIN_NAV: NavItem[] = [
  { href: '/admin/eventos', label: 'Moderar Eventos', icon: ShieldCheck, adminOnly: true },
  { href: '/admin/locales', label: 'Moderar Locales', icon: MapPin, adminOnly: true },
  { href: '/admin/blog', label: 'Moderar Blog', icon: FileText, adminOnly: true },
]

interface AppSidebarProps {
  defaultCollapsed?: boolean
}

export function AppSidebar({ defaultCollapsed = false }: AppSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const isAdmin = session?.user?.role === 'ADMIN'
  const sidebarWidth = collapsed ? 64 : 224

  function renderNavGroup(title: string, items: NavItem[]) {
    return (
      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key={`group-${title}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="px-2.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>

        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-sm font-medium transition-colors duration-150',
                active
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-pill"
                  className="absolute inset-0 rounded-xl bg-accent"
                  transition={iosSpring}
                />
              )}
              {!active && (
                <span className="absolute inset-0 rounded-xl bg-secondary opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
              )}
              <Icon className="relative z-10 h-4 w-4 shrink-0" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    key={`label-${item.href}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <motion.aside
      animate={{ width: sidebarWidth }}
      transition={iosSpring}
      className="relative flex h-full shrink-0 flex-col overflow-hidden border-r border-border/50 bg-card/80 backdrop-blur-xl"
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b border-border/40 px-3">
        <Link href="/" className="flex items-center gap-2.5 press-scale overflow-hidden">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Compass className="h-3.5 w-3.5" />
          </span>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="logo-text"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="whitespace-nowrap text-sm font-semibold text-foreground"
              >
                CityListing
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-2">
        {renderNavGroup('Crear', CREATE_NAV)}
        {renderNavGroup('Gestión', MANAGE_NAV)}
        {isAdmin && renderNavGroup('Admin', ADMIN_NAV)}
      </nav>

      {/* User section */}
      <div className="shrink-0 border-t border-border/40 p-2 space-y-0.5">
        {/* Settings link */}
        <Link
          href="/dashboard/configuracion"
          className="group relative flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="absolute inset-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100 bg-secondary" />
          <Settings className="relative z-10 h-4 w-4 shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="settings-label"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 whitespace-nowrap"
              >
                Configuración
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* User row */}
        <div className="flex h-10 items-center gap-2.5 overflow-hidden rounded-xl px-2.5">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={session?.user?.image ?? ''} alt={session?.user?.name ?? ''} />
            <AvatarFallback className="text-[10px]">
              {session?.user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="user-info"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="flex min-w-0 flex-1 flex-col"
              >
                <span className="truncate text-xs font-medium text-foreground">
                  {session?.user?.name ?? 'Usuario'}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {session?.user?.email ?? ''}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.button
                key="signout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => signOut({ callbackUrl: '/' })}
                className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-[52px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </motion.aside>
  )
}
