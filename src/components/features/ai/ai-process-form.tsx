'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Upload, FileText, Image as ImageIcon, CheckCircle, AlertTriangle, X, MapPin, Monitor, Gift } from 'lucide-react'
import { processFlyerAction } from '@/actions/ai/process'
import { confirmProcessingAction } from '@/actions/ai/confirm'
import type { ExtractedData } from '@/lib/ai/pipeline'

type PreviewData = {
  logId: string
  extracted: ExtractedData
  sourceUrl: string | null
  duplicateEvent: { id: string; name: string; confidence: number } | null
  processingTimeMs: number
  tokensUsed: number | null
  matchedVenues: Array<{ id: string; name: string; slug: string }>
}

const TYPE_LABELS: Record<string, string> = {
  SPORTS: 'Deportes',
  CONCERT: 'Concierto',
  THEATER: 'Teatro',
  ESPORTS: 'eSports',
  OTHER: 'Otro',
}

export function AIProcessForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'file' | 'text'>('file')
  const [text, setText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processing, startProcess] = useTransition()
  const [confirming, startConfirm] = useTransition()
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [selectedVenueIds, setSelectedVenueIds] = useState<string[]>([])
  const [customEventName, setCustomEventName] = useState('')

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  function handleProcess() {
    startProcess(async () => {
      setPreview(null)
      const formData = new FormData()
      if (mode === 'file' && selectedFile) {
        formData.append('file', selectedFile)
      } else if (mode === 'text' && text.trim()) {
        formData.append('text', text.trim())
      } else {
        toast.error('Proporciona un archivo o texto.')
        return
      }

      const res = await processFlyerAction(formData)
      if (res.success && res.data) {
        setPreview(res.data)
        setSelectedVenueIds(res.data.matchedVenues.map((v) => v.id))
        if (res.data.extracted.venueName) {
          setCustomEventName(res.data.extracted.performers.join(' vs '))
        }
      } else {
        toast.error(res.error || 'Error procesando')
      }
    })
  }

  function handleConfirm() {
    if (!preview) return
    startConfirm(async () => {
      const res = await confirmProcessingAction({
        logId: preview.logId,
        extracted: preview.extracted,
        venueIds: selectedVenueIds,
        duplicateEventId: preview.duplicateEvent?.id,
        eventName: customEventName || undefined,
      })
      if (res.success && res.data) {
        toast.success('Evento creado / vinculado exitosamente')
        router.push(`/admin/transmisiones`)
      } else {
        toast.error(res.error || 'Error confirmando')
      }
    })
  }

  function toggleVenue(id: string) {
    setSelectedVenueIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Procesar Flyer / Texto</CardTitle>
          <CardDescription>Sube una imagen, PDF o pega texto promocional. La IA extraerá automáticamente la información del evento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === 'file' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('file')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Archivo
            </Button>
            <Button
              variant={mode === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('text')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Texto
            </Button>
          </div>

          {mode === 'file' ? (
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    {selectedFile.type.startsWith('image/') ? (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Arrastra o haz clic para subir JPG, PNG, WEBP o PDF
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Textarea
              placeholder="Ej: Transmitiremos Ecuador vs Brasil este viernes a las 19:00. Pantalla gigante. 2x1 en cerveza. Reserva tu mesa."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
            />
          )}

          <Button onClick={handleProcess} disabled={processing || (mode === 'file' ? !selectedFile : !text.trim())}>
            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {processing ? 'Procesando con IA...' : 'Procesar'}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {preview && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vista Previa</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {preview.tokensUsed && <span>{preview.tokensUsed} tokens</span>}
                <span>{preview.processingTimeMs}ms</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Duplicate Warning */}
            {preview.duplicateEvent && (
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-4 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">Evento duplicado detectado</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Ya existe un evento similar: <strong>{preview.duplicateEvent.name}</strong> (confianza: {preview.duplicateEvent.confidence}%)
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                    Se vincularán los negocios a este evento existente en lugar de crear uno nuevo.
                  </p>
                </div>
              </div>
            )}

            {/* Extracted Data */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <Badge variant="secondary">{TYPE_LABELS[preview.extracted.type] || preview.extracted.type}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Participantes</Label>
                  <p className="font-medium">{preview.extracted.performers.join(' vs ') || 'No detectado'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Competición</Label>
                  <p className="font-medium">{preview.extracted.competition || 'No detectada'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fecha y Hora</Label>
                  <p className="font-medium">
                    {preview.extracted.matchDate || 'No detectada'}
                    {preview.extracted.matchTime ? ` a las ${preview.extracted.matchTime}` : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Local Detectado</Label>
                  <p className="font-medium">{preview.extracted.venueName || 'No detectado'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Pantalla Gigante</Label>
                  <p className="font-medium">{preview.extracted.hasBigScreen ? 'Sí' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Entrada Gratuita</Label>
                  <p className="font-medium">{preview.extracted.hasFreeEntry ? 'Sí' : 'No'}</p>
                </div>
                {preview.extracted.promotions.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Promociones</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {preview.extracted.promotions.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Matched Venues */}
            {preview.matchedVenues.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Negocios encontrados (selecciona los que participan)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {preview.matchedVenues.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => toggleVenue(v.id)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border transition-colors ${
                        selectedVenueIds.includes(v.id)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      {selectedVenueIds.includes(v.id) ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      )}
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {preview.matchedVenues.length === 0 && preview.extracted.venueName && (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                No se encontraron negocios con el nombre &quot;{preview.extracted.venueName}&quot;. Los negocios se pueden vincular manualmente después.
              </div>
            )}

            {/* Custom event name (if creating new) */}
            {!preview.duplicateEvent && (
              <div className="space-y-2">
                <Label>Nombre del evento (editable)</Label>
                <Input
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                  placeholder={preview.extracted.performers.join(' vs ')}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleConfirm} disabled={confirming}>
                {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {preview.duplicateEvent ? 'Vincular a evento existente' : 'Crear evento y publicar'}
              </Button>
              <Button variant="outline" onClick={() => { setPreview(null); setSelectedFile(null); setText('') }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Image */}
      {preview?.sourceUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fuente</CardTitle>
          </CardHeader>
          <CardContent>
            <a href={preview.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
              Ver archivo original
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
