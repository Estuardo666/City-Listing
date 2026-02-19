'use client'

import { useEffect } from 'react'
import mapboxgl from 'mapbox-gl'

export function MapboxWorkerSetup() {
  useEffect(() => {
    mapboxgl.workerUrl = '/mapbox-gl-csp-worker.js'
  }, [])

  return null
}
