'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Search, ArrowRight, ArrowLeft, Loader2, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogFeed, createLog, type LogEntry } from './log-feed'
import { MapPreview } from './map-preview'
import { SlowJobProgress } from './slow-job-progress'
import { GOOGLE_CATEGORIES } from '@/types/google-import'

type Step = 'search' | 'categorize' | 'duplicates' | 'save' | 'job'

interface GeoResult {
  placeId: string
  name: string
  formattedAddress: string
  lat: number
  lng: number
}

interface PlaceResult {
  google_place_id: string
  name: string
  category: string
  address: string
  phone: string | null
  lat: number
  lng: number
  alreadyImported?: boolean
}

const RADIUS_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
  { value: 50000, label: '50 km' },
]

const DELAY_OPTIONS = [
  { value: 0, label: 'Sin pausa (rápido)', desc: 'Para pruebas en localhost' },
  { value: 10000, label: '10 segundos', desc: '~360 locales/hora' },
  { value: 36000, label: '36 segundos', desc: '~100 locales/hora' },
  { value: 72000, label: '72 segundos', desc: '~50 locales/hora (500 en 10h)' },
  { value: 144000, label: '144 segundos', desc: '~25 locales/hora' },
]

export function SlowImportWizard() {
  const [step, setStep] = useState<Step>('search')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [address, setAddress] = useState('')
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null)
  const [radius, setRadius] = useState(5000)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['restaurant'])
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [delayMs, setDelayMs] = useState(72000)
  const [isSearching, setIsSearching] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const addLog = useCallback((log: LogEntry) => setLogs((prev) => [...prev, log]), [])

  // Step 1: Geocode address
  const handleGeocode = async () => {
    if (!address.trim()) return
    setIsGeocoding(true)
    addLog(createLog('info', `Buscando: "${address}"`))

    try {
      const res = await fetch(`/api/admin/imports/google/geocode?address=${encodeURIComponent(address)}`)
      if (!res.ok) throw new Error('Dirección no encontrada')
      const data = await res.json()
      setGeoResult(data.data)
      addLog(createLog('success', `${data.data.formattedAddress} → (${data.data.lat.toFixed(4)}, ${data.data.lng.toFixed(4)})`))
    } catch (err) {
      addLog(createLog('error', err instanceof Error ? err.message : 'Error'))
    } finally {
      setIsGeocoding(false)
    }
  }

  // Step 2: Search places
  const handleSearch = async () => {
    if (!geoResult) return
    setIsSearching(true)
    addLog(createLog('info', `Buscando ${selectedCategories.length} categorías en radio ${radius >= 1000 ? `${radius/1000}km` : `${radius}m`}`))

    try {
      const params = new URLSearchParams({
        lat: geoResult.lat.toString(),
        lng: geoResult.lng.toString(),
        radius: radius.toString(),
        categories: selectedCategories.join(','),
        address: geoResult.formattedAddress,
        maxResults: '500',
      })

      const res = await fetch(`/api/admin/imports/google/search?${params}`)
      if (!res.ok) throw new Error('Error en la búsqueda')
      const data = await res.json()

      setSearchResults(data.data)
      setSelectedIds(new Set(data.data.filter((p: PlaceResult) => !p.alreadyImported).map((p: PlaceResult) => p.google_place_id)))
      addLog(createLog('success', `${data.data.length} resultados encontrados`))

      const duplicates = data.data.filter((p: PlaceResult) => p.alreadyImported).length
      if (duplicates > 0) addLog(createLog('warning', `${duplicates} ya importados`))

      if (data.data.length > 0) setStep('duplicates')
      else addLog(createLog('warning', 'Sin resultados'))
    } catch (err) {
      addLog(createLog('error', err instanceof Error ? err.message : 'Error'))
    } finally {
      setIsSearching(false)
    }
  }

  // Step 4: Start slow import
  const handleStartImport = async () => {
    const selected = searchResults.filter((p) => selectedIds.has(p.google_place_id))
    if (selected.length === 0) return

    addLog(createLog('info', `Iniciando importación lenta de ${selected.length} locales...`))

    try {
      const res = await fetch('/api/admin/imports/google/slow/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          places: selected.map((p) => ({
            google_place_id: p.google_place_id,
            name: p.name,
            category: p.category,
            address: p.address,
            phone: p.phone,
            lat: p.lat,
            lng: p.lng,
          })),
          categoryIds: [],
          duplicateAction: 'skip',
          delayMs,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear job')
      }

      const data = await res.json()
      addLog(createLog('success', `Job creado: ${data.jobId}`))
      toast.success('Importación lenta iniciada')
      setActiveJobId(data.jobId)
      setStep('job')
    } catch (err) {
      addLog(createLog('error', err instanceof Error ? err.message : 'Error'))
      toast.error(err instanceof Error ? err.message : 'Error al iniciar')
    }
  }

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const newCount = searchResults.filter((p) => !p.alreadyImported).length
  const dupCount = searchResults.filter((p) => p.alreadyImported).length

  const steps: { key: Step; label: string }[] = [
    { key: 'search', label: 'Buscar' },
    { key: 'categorize', label: 'Categorizar' },
    { key: 'duplicates', label: 'Duplicados' },
    { key: 'save', label: 'Guardar' },
  ]
  const currentIdx = steps.findIndex((s) => s.key === step)

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      {step !== 'job' && (
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                  i < currentIdx
                    ? 'bg-green-500 text-white'
                    : i === currentIdx
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < currentIdx ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm ${i === currentIdx ? 'font-medium' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < currentIdx ? 'bg-green-500' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      <LogFeed logs={logs} />

      {/* Step 1: Search */}
      {step === 'search' && (
        <Card>
          <CardHeader>
            <CardTitle>Buscar ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder='Ej: "Loja, Ecuador"'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
              />
              <Button onClick={handleGeocode} disabled={isGeocoding || !address.trim()}>
                {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {geoResult && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-medium text-green-800">{geoResult.name}</p>
                  <p className="text-sm text-green-700">{geoResult.formattedAddress}</p>
                </div>
                <MapPreview lat={geoResult.lat} lng={geoResult.lng} radius={radius} />

                <div className="space-y-2">
                  <Label>Radio</Label>
                  <div className="flex flex-wrap gap-2">
                    {RADIUS_OPTIONS.map((opt) => (
                      <Button key={opt.value} variant={radius === opt.value ? 'default' : 'outline'} size="sm" onClick={() => setRadius(opt.value)}>
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button onClick={() => setStep('categorize')} className="w-full">
                  Siguiente: Categorizar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Categorize */}
      {step === 'categorize' && (
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar categorías</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(GOOGLE_CATEGORIES).map(([key, cat]) => (
                <div
                  key={key}
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${selectedCategories.includes(key) ? 'bg-primary/5 border-primary/30' : ''}`}
                  onClick={() => toggleCategory(key)}
                >
                  <Checkbox checked={selectedCategories.includes(key)} onCheckedChange={() => toggleCategory(key)} />
                  <Label className="cursor-pointer text-sm">{cat.label}</Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('search')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button onClick={handleSearch} disabled={selectedCategories.length === 0 || isSearching} className="flex-1">
                {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Buscar negocios
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Duplicates */}
      {step === 'duplicates' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revisar resultados</CardTitle>
              <div className="flex gap-2 text-sm">
                <Badge variant="outline">Total: {searchResults.length}</Badge>
                <Badge variant="default">Nuevos: {newCount}</Badge>
                {dupCount > 0 && <Badge variant="secondary">Duplicados: {dupCount}</Badge>}
                <Badge variant="default">Seleccionados: {selectedIds.size}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="w-10 px-3 py-2"></th>
                    <th className="px-3 py-2 text-left">Nombre</th>
                    <th className="px-3 py-2 text-left">Categoría</th>
                    <th className="px-3 py-2 text-left hidden md:table-cell">Dirección</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((place) => (
                    <tr key={place.google_place_id} className={`border-t ${place.alreadyImported ? 'opacity-50' : ''}`}>
                      <td className="px-3 py-2">
                        {!place.alreadyImported && (
                          <Checkbox checked={selectedIds.has(place.google_place_id)} onCheckedChange={() => toggleSelect(place.google_place_id)} />
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">{place.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{place.category}</td>
                      <td className="px-3 py-2 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{place.address}</td>
                      <td className="px-3 py-2">
                        {place.alreadyImported ? (
                          <Badge variant="secondary" className="text-xs">Duplicado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-green-600">Nuevo</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('categorize')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button onClick={() => setStep('save')} disabled={selectedIds.size === 0} className="flex-1">
                Siguiente: Configurar importación
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Save */}
      {step === 'save' && (
        <Card>
          <CardHeader>
            <CardTitle>Configurar importación lenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm"><strong>Locales seleccionados:</strong> {selectedIds.size}</p>
              <p className="text-sm">Los negocios se crearán como <Badge variant="secondary">BORRADOR</Badge></p>
              <p className="text-sm text-muted-foreground">Podrás publicarlos en lote desde la pestaña "Borradores"</p>
            </div>

            <div className="space-y-3">
              <Label>Velocidad de importación</Label>
              <div className="space-y-2">
                {DELAY_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${delayMs === opt.value ? 'bg-primary/5 border-primary/30' : ''}`}
                    onClick={() => setDelayMs(opt.value)}
                  >
                    <div className="flex items-center gap-2">
                      <input type="radio" name="delay" checked={delayMs === opt.value} readOnly />
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </div>
                    {opt.value > 0 && (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        ~{Math.round((selectedIds.size * opt.value) / 3600000)}h {Math.round(((selectedIds.size * opt.value) % 3600000) / 60000)}m
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('duplicates')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button onClick={handleStartImport} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Iniciar importación lenta ({selectedIds.size} locales)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Job progress */}
      {step === 'job' && activeJobId && (
        <SlowJobProgress
          jobId={activeJobId}
          onDone={() => toast.success('Importación finalizada. Revisa los borradores.')}
        />
      )}
    </div>
  )
}
