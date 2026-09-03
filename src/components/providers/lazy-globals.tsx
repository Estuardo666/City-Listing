'use client'

import dynamic from 'next/dynamic'

import { ServiceWorkerRegister } from '@/components/providers/service-worker-register'

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
      <ServiceWorkerRegister />
      <NotificationCenter />
      <CommandPalette />
    </>
  )
}
