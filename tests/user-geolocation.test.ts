import assert from 'node:assert/strict'
import test from 'node:test'

import {
  geolocationErrorMessage,
  requestUserLocation,
} from '../src/components/features/explore/user-geolocation'

function geolocationError(code: number): GeolocationPositionError {
  return {
    code,
    message: 'browser error',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  }
}

test('requests a cached, balanced-accuracy position with a production-friendly timeout', async () => {
  let receivedOptions: PositionOptions | undefined
  const geolocation = {
    getCurrentPosition(success: PositionCallback, _error?: PositionErrorCallback | null, options?: PositionOptions) {
      receivedOptions = options
      success({ coords: { latitude: -3.9931, longitude: -79.2042 } } as GeolocationPosition)
    },
  } as Geolocation

  const result = await requestUserLocation(geolocation)

  assert.deepEqual(result, { lat: -3.9931, lng: -79.2042 })
  assert.deepEqual(receivedOptions, {
    enableHighAccuracy: false,
    timeout: 20_000,
    maximumAge: 300_000,
  })
})

test('turns a timeout into an actionable message instead of failing silently', async () => {
  const geolocation = {
    getCurrentPosition(_success: PositionCallback, error?: PositionErrorCallback | null) {
      error?.(geolocationError(3))
    },
  } as Geolocation

  await assert.rejects(
    requestUserLocation(geolocation),
    /La ubicación tardó demasiado/
  )
})

test('explains how to recover when location permission is denied', () => {
  assert.match(geolocationErrorMessage(geolocationError(1)), /Permite el acceso/)
})
