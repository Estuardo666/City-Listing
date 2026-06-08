'use client'

import dynamic from 'next/dynamic'

const NotificationCenter = dynamic(
  () => import('@/components/features/notifications/notification-center').then((mod) => mod.NotificationCenter),
  { ssr: false }
)

const CommandPalette = dynamic(
  () => import('@/components/features/search/command-palette').then((mod) => mod.CommandPalette),
  { ssr: false }
)

export function LazyGlobals() {
  return (
    <>
      <NotificationCenter />
      <CommandPalette />
    </>
  )
}
