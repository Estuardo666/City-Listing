'use client'

import { useEffect } from 'react'

export function MapboxTokenTest() {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'no-token-found'
    console.log('Token being used:', token.substring(0, 20) + '...')
    
    // Test if token can fetch styles
    fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${token}`)
      .then(response => {
        if (response.ok) {
          console.log('✅ Token is valid and can fetch styles')
        } else {
          console.error('❌ Token error:', response.status, response.statusText)
        }
      })
      .catch(error => {
        console.error('❌ Network error:', error)
      })
  }, [])

  return null
}
