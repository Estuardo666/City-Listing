'use client'

import { useEffect } from 'react'

export function ScrollLockFix() {
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document.body.hasAttribute('data-scroll-locked')) {
        document.body.style.removeProperty('overflow')
        document.body.style.removeProperty('padding-right')
        document.body.style.removeProperty('margin-right')
      }
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scroll-locked', 'style'],
    })

    return () => observer.disconnect()
  }, [])

  return null
}
