'use client'

import { useEffect } from 'react'

export function MapboxWorkerSetup() {
  useMapboxWorkerSetup()
  return null
}

export function useMapboxWorkerSetup() {
  useEffect(() => {
    import('mapbox-gl').then((mapboxgl) => {
      mapboxgl.default.workerUrl = '/mapbox-gl-csp-worker.js'
    })
  }, [])
}
