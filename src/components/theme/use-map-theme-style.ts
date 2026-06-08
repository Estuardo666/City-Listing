'use client'

import { useEffect, useMemo, useState } from 'react'
import { VIVE_LOJA_MAP_STYLE } from '@/lib/map-style'

type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'theme'
const DEFAULT_DARK_MAP_STYLE = 'mapbox://styles/mapbox/dark-v11'

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light'

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useMapThemeStyle(lightStyle?: string | mapboxgl.Style, darkStyle?: string): string | mapboxgl.Style {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')

  useEffect(() => {
    const syncTheme = () => {
      const mode = document.documentElement.classList.contains('dark') ? 'dark' : getInitialThemeMode()
      setThemeMode(mode)
    }

    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return
      syncTheme()
    }

    window.addEventListener('storage', onStorage)

    return () => {
      observer.disconnect()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return useMemo(() => {
    if (themeMode === 'dark') {
      return darkStyle ?? process.env.NEXT_PUBLIC_MAPBOX_DARK_STYLE ?? DEFAULT_DARK_MAP_STYLE
    }
    return lightStyle ?? (VIVE_LOJA_MAP_STYLE as unknown as mapboxgl.Style)
  }, [darkStyle, lightStyle, themeMode])
}
