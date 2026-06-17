'use client'

import { useEffect } from 'react'
import { trackOnboardingEventAction } from '@/actions/onboarding/track-event'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    trackOnboardingEventAction('STARTED').catch(() => {})
  }, [])

  return <>{children}</>
}
