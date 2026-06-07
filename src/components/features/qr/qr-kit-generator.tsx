'use client'

import { useCallback, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Download, Loader2, Printer } from 'lucide-react'
import { DoorStickerTemplate } from './door-sticker-template'

type QRKitGeneratorProps = {
  venueName: string
  venueSlug: string
}

export function QRKitGenerator({ venueName, venueSlug }: QRKitGeneratorProps) {
  const [customText, setCustomText] = useState(
    'Escanea para ver nuestro menú y ofertas actualizadas en Vive Loja'
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const stickerRef = useRef<HTMLDivElement>(null)

  const handleDownload = useCallback(async () => {
    if (!stickerRef.current) return

    setIsGenerating(true)
    try {
      const dataUrl = await toPng(stickerRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      })

      const link = document.createElement('a')
      link.download = `sticker-${venueSlug}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Error generating image:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [venueSlug])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kit QR / Sticker de Puerta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Genera un sticker con código QR para que tus clientes accedan a tu perfil en Vive Loja.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        {/* Panel de configuración */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="text-lg font-bold text-foreground">Personalizar</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="customText"
                  className="text-sm font-medium text-foreground"
                >
                  Texto del sticker
                </label>
                <textarea
                  id="customText"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  maxLength={120}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Texto que aparecerá en el sticker..."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {customText.length}/120 caracteres
                </p>
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="text-lg font-bold text-foreground">Instrucciones de uso</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  1
                </span>
                Personaliza el texto si lo deseas
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  2
                </span>
                Haz clic en &quot;Descargar PNG&quot;
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  3
                </span>
                Imprime el sticker en papel adhesivo (tamaño recomendado: 10x12 cm)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  4
                </span>
                Pégalo en la puerta de tu negocio donde sea visible
              </li>
            </ol>
          </div>

          {/* Botón de descarga */}
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando imagen...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar PNG
              </>
            )}
          </button>
        </div>

        {/* Preview del sticker */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="text-lg font-bold text-foreground">Vista previa</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Así se verá tu sticker impreso
            </p>
          </div>

          <div className="flex justify-center">
            <div ref={stickerRef}>
              <DoorStickerTemplate
                venueName={venueName}
                venueSlug={venueSlug}
                customText={customText}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
