'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/admin/imports/google', label: 'Importador', key: 'import' },
  { href: '/admin/imports/google/jobs', label: 'Historial', key: 'jobs' },
]

export function GoogleImportTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 rounded-xl bg-muted p-1">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || (tab.key !== 'import' && pathname.startsWith(tab.href))
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
  )
}
