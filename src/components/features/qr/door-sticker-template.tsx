'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

type DoorStickerTemplateProps = {
  venueName: string
  venueSlug: string
  customText?: string
  className?: string
}

export function DoorStickerTemplate({
  venueName,
  venueSlug,
  customText = 'Escanea para ver nuestro menú y ofertas actualizadas en Vive Loja',
  className = '',
}: DoorStickerTemplateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  const venueUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/locales/${venueSlug}`
    : `https://viveloja.com/locales/${venueSlug}`

  useEffect(() => {
    QRCode.toDataURL(venueUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1e1b4b', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(setQrDataUrl)
  }, [venueUrl])

  return (
    <div
      id="door-sticker-template"
      className={`relative w-[400px] overflow-hidden rounded-3xl bg-white shadow-2xl ${className}`}
      style={{ aspectRatio: '1 / 1.2' }}
    >
      {/* Header con gradiente */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-8 py-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">📍</span>
          <h1 className="text-xl font-black tracking-tight text-white">Vive Loja</h1>
        </div>
        <p className="mt-1 text-xs font-medium text-indigo-200">Tu guía de la ciudad</p>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col items-center px-8 py-6">
        {/* Nombre del venue */}
        <h2 className="text-center text-lg font-bold text-gray-900 line-clamp-2">
          {venueName}
        </h2>

        {/* QR Code */}
        <div className="my-5 rounded-2xl border-4 border-indigo-100 bg-white p-3 shadow-inner">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code para ${venueName}`}
              className="h-[220px] w-[220px]"
            />
          ) : (
            <canvas ref={canvasRef} className="h-[220px] w-[220px]" />
          )}
        </div>

        {/* Texto CTA */}
        <p className="text-center text-sm font-semibold leading-snug text-gray-600">
          {customText}
        </p>

        {/* URL visible */}
        <p className="mt-2 text-[10px] font-medium text-gray-400">
          viveloja.com/locales/{venueSlug}
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-indigo-50 px-8 py-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
          Escanea y descubre
        </p>
      </div>
    </div>
  )
}
