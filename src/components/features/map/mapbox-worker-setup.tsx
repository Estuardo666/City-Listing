'use client'

import { useEffect } from 'react'

export function MapboxWorkerSetup() {
  useEffect(() => {
    import('mapbox-gl').then((mapboxgl) => {
      mapboxgl.default.workerUrl = '/mapbox-gl-csp-worker.js'
    })
  }, [])

  return null
}
