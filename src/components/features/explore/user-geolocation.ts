export type BrowserCoordinates = {
  lat: number
  lng: number
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 20_000,
  maximumAge: 300_000,
}

export function geolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permite el acceso a tu ubicación en el navegador e inténtalo de nuevo.'
    case error.POSITION_UNAVAILABLE:
      return 'No pudimos detectar tu ubicación. Activa la ubicación del dispositivo e inténtalo de nuevo.'
    case error.TIMEOUT:
      return 'La ubicación tardó demasiado. Verifica que esté activada e inténtalo de nuevo.'
    default:
      return 'No pudimos obtener tu ubicación. Inténtalo de nuevo.'
  }
}

export function requestUserLocation(geolocation: Geolocation): Promise<BrowserCoordinates> {
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => reject(new Error(geolocationErrorMessage(error))),
      GEOLOCATION_OPTIONS
    )
  })
}
