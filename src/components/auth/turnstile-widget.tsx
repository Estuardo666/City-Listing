'use client'

import { useEffect, useRef, useCallback } from 'react'

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  theme?: 'light' | 'dark' | 'auto'
  className?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
      reset: (widgetId: string) => void
    }
  }
}

const SCRIPT_ID = 'turnstile-script'
const CONTAINER_ID = 'turnstile-container'

export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  theme = 'auto',
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onVerifyRef = useRef(onVerify)
  const onExpireRef = useRef(onExpire)
  const onErrorRef = useRef(onError)

  // Keep callbacks up to date
  onVerifyRef.current = onVerify
  onExpireRef.current = onExpire
  onErrorRef.current = onError

  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || !siteKey) return

    // Remove existing widget if any
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current)
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      appearance: 'interaction-only',
      theme,
      callback: (token: string) => {
        onVerifyRef.current(token)
      },
      'expired-callback': () => {
        onExpireRef.current?.()
      },
      'error-callback': () => {
        onErrorRef.current?.()
      },
    })
  }, [siteKey, theme])

  useEffect(() => {
    if (!siteKey) {
      console.warn('NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY is not set')
      return
    }

    // Load script if not already loaded
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => {
        renderWidget()
      }
      document.head.appendChild(script)
    } else if (window.turnstile) {
      renderWidget()
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, renderWidget])

  if (!siteKey) {
    return null
  }

  return (
    <div
      ref={containerRef}
      id={CONTAINER_ID}
      className={className}
    />
  )
}
