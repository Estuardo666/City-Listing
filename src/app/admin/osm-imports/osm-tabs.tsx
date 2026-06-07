'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/admin/osm-imports', label: 'Dashboard', key: 'dashboard' },
  { href: '/admin/osm-imports/nueva-importacion', label: 'Nueva Importación', key: 'nueva' },
  { href: '/admin/osm-imports/historial', label: 'Historial', key: 'historial' },
  { href: '/admin/osm-imports/cola', label: 'Cola', key: 'cola' },
  { href: '/admin/osm-imports/configuracion', label: 'Configuración', key: 'config' },
]

export function OsmTabs({ children, defaultTab }: { children: React.ReactNode; defaultTab?: string }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <nav className="flex gap-1 rounded-xl bg-muted p-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
