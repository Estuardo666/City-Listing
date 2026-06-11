'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WizardAddress, type GeoResult } from './wizard-address'
import { WizardRadius } from './wizard-radius'
import { WizardCategories } from './wizard-categories'
import { WizardResults, type PlaceResult } from './wizard-results'
import { GoogleImportPreview } from './google-import-preview'
import { BulkImportConfirm } from './bulk-import-confirm'
import { JobProgress } from './job-progress'
import { LogFeed, createLog, type LogEntry } from './log-feed'
import type { DuplicateCheckResult } from '@/types/google-import'

interface Subcategory {
  id: string
  name: string
  slug: string
  icon: string | null
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  subcategories: Subcategory[]
}

type Step = 'address' | 'radius' | 'categories' | 'results' | 'preview' | 'job'

const STEP_LABELS: Record<Step, string> = {
  address: 'Dirección',
  radius: 'Radio',
  categories: 'Categorías',
  results: 'Resultados',
  preview: 'Confirmar',
  job: 'Importando',
}

const STEPS_ORDER: Step[] = ['address', 'radius', 'categories', 'results']

export function GooglePlacesWizard({ categories }: { categories: Category[] }) {
  const [step, setStep] = useState<Step>('address')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null)
  const [radius, setRadius] = useState(5000)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [selectedForImport, setSelectedForImport] = useState<PlaceResult[]>([])
  const [duplicates] = useState<Map<string, DuplicateCheckResult>>(new Map())
  const [isSearching, setIsSearching] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isCreatingJob, setIsCreatingJob] = useState(false)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [searchPage, setSearchPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const addLog = useCallback((log: LogEntry) => {
    setLogs((prev) => [...prev, log])
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  // Step 1 → 2
  const handleAddressResolved = useCallback(
    (result: GeoResult) => {
      setGeoResult(result)
      setStep('radius')
    },
    []
  )

  // Step 2 → 3
  const handleRadiusConfirmed = useCallback(
    (r: number) => {
      setRadius(r)
      addLog(createLog('success', `Radio confirmado: ${r >= 1000 ? `${r / 1000} km` : `${r} m`}`))
      setStep('categories')
    },
    [addLog]
  )

  // Step 3 → 4 (execute search)
  const handleSearch = useCallback(
    async (cats: string[]) => {
      if (!geoResult) return

      setSelectedCategories(cats)
      setIsSearching(true)
      clearLogs()
      setSearchPage(0)
      setHasMore(false)

      addLog(createLog('info', `Iniciando búsqueda en: ${geoResult.formattedAddress}`))
      addLog(
        createLog(
          'info',
          `Radio: ${radius >= 1000 ? `${radius / 1000} km` : `${radius} m`} | Categorías: ${cats.length}`
        )
      )

      try {
        const params = new URLSearchParams({
          lat: geoResult.lat.toString(),
          lng: geoResult.lng.toString(),
          radius: radius.toString(),
          categories: cats.join(','),
          address: geoResult.formattedAddress,
          page: '0',
        })

        addLog(createLog('info', 'Consultando Google Places API...'))

        const res = await fetch(`/api/admin/imports/google/search?${params.toString()}`)

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al buscar')
        }

        const result = await res.json()
        setSearchResults(result.data)
        setHasMore(result.hasMore)
        setSearchPage(0)

        addLog(createLog('success', `${result.data.length} resultados encontrados`))

        const imported = result.data.filter((p: PlaceResult) => p.alreadyImported).length
        if (imported > 0) {
          addLog(createLog('warning', `${imported} negocios ya importados (duplicados)`))
        }

        if (result.data.length === 0) {
          toast.info('No se encontraron negocios con esos criterios')
          addLog(createLog('warning', 'Sin resultados. Intenta con otro radio o más categorías.'))
        } else {
          setStep('results')
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error al buscar'
        addLog(createLog('error', msg))
        toast.error(msg)
      } finally {
        setIsSearching(false)
      }
    },
    [geoResult, radius, addLog, clearLogs]
  )

  // Step 4 → preview
  const handleSelectForImport = useCallback(
    (places: PlaceResult[]) => {
      if (places.length === 0) return

      if (places.length > 500) {
        setSelectedForImport(places)
        setShowBulkConfirm(true)
        return
      }

      setSelectedForImport(places)
      setStep('preview')
    },
    []
  )

  const handleImportAll = useCallback(() => {
    const available = searchResults.filter((p) => !p.alreadyImported)
    if (available.length === 0) {
      toast.info('No hay negocios nuevos para importar')
      return
    }

    if (available.length > 500) {
      setSelectedForImport(available)
      setShowBulkConfirm(true)
      return
    }

    setSelectedForImport(available)
    setStep('preview')
  }, [searchResults])

  const handleLoadMore = useCallback(async () => {
    if (!geoResult || isLoadingMore) return

    const nextPage = searchPage + 1
    setIsLoadingMore(true)
    addLog(createLog('info', `Cargando página ${nextPage + 1}...`))

    try {
      const params = new URLSearchParams({
        lat: geoResult.lat.toString(),
        lng: geoResult.lng.toString(),
        radius: radius.toString(),
        categories: selectedCategories.join(','),
        address: geoResult.formattedAddress,
        page: nextPage.toString(),
      })

      const res = await fetch(`/api/admin/imports/google/search?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al buscar')
      }

      const result = await res.json()
      const existingIds = new Set(searchResults.map((p) => p.google_place_id))
      const newResults = result.data.filter(
        (p: PlaceResult) => !existingIds.has(p.google_place_id)
      )

      setSearchResults((prev) => [...prev, ...newResults])
      setSearchPage(nextPage)
      setHasMore(result.hasMore)

      addLog(
        createLog(
          'success',
          `+${newResults.length} resultados nuevos (${searchResults.length + newResults.length} total)`
        )
      )
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al cargar más'
      addLog(createLog('error', msg))
    } finally {
      setIsLoadingMore(false)
    }
  }, [geoResult, searchPage, isLoadingMore, searchResults, radius, selectedCategories, addLog])

  // Direct import (≤500 records)
  const handleDirectImport = useCallback(
    async (places: PlaceResult[], categoryIds: string[], duplicateAction: 'skip' | 'update') => {
      setIsImporting(true)
      addLog(createLog('info', `Importando ${places.length} negocios...`))

      try {
        const res = await fetch('/api/admin/imports/google/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            places: places.map((p) => ({
              google_place_id: p.google_place_id,
              name: p.name,
              category: p.category,
              address: p.address,
              phone: p.phone,
              lat: p.lat,
              lng: p.lng,
            })),
            categoryIds,
            duplicateAction,
            address: geoResult?.formattedAddress || '',
            categories: selectedCategories,
            radius,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al importar')
        }

        const result = await res.json()
        addLog(
          createLog(
            'success',
            `Importados: ${result.stats.imported}, Duplicados: ${result.stats.skipped}, Errores: ${result.stats.errors}`
          )
        )
        toast.success(
          `Importados: ${result.stats.imported}, Duplicados: ${result.stats.skipped}, Errores: ${result.stats.errors}`
        )

        resetWizard()
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error al importar'
        addLog(createLog('error', msg))
        toast.error(msg)
      } finally {
        setIsImporting(false)
      }
    },
    [addLog]
  )

  // Bulk import (>500 records) → job
  const handleBulkImport = useCallback(async () => {
    if (!geoResult) return

    setIsCreatingJob(true)
    addLog(createLog('info', `Creando job de importación para ${selectedForImport.length} registros...`))

    try {
      const res = await fetch('/api/admin/imports/google/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          places: selectedForImport.map((p) => ({
            google_place_id: p.google_place_id,
            name: p.name,
            category: p.category,
            address: p.address,
            phone: p.phone,
            lat: p.lat,
            lng: p.lng,
          })),
          categoryIds: [categories[0]?.id || ''].filter(Boolean),
          duplicateAction: 'skip',
          country: '',
          province: '',
          city: geoResult.formattedAddress,
          categories: selectedCategories,
          radius,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear job')
      }

      const result = await res.json()
      addLog(createLog('success', `Job creado: ${result.jobId}`))
      toast.success('Job de importación creado')
      setActiveJobId(result.jobId)
      setStep('job')
      setShowBulkConfirm(false)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al crear job'
      addLog(createLog('error', msg))
      toast.error(msg)
    } finally {
      setIsCreatingJob(false)
    }
  }, [geoResult, selectedForImport, selectedCategories, radius, categories, addLog])

  const resetWizard = useCallback(() => {
    setStep('address')
    setGeoResult(null)
    setRadius(5000)
    setSelectedCategories([])
    setSearchResults([])
    setSelectedForImport([])
    setActiveJobId(null)
    clearLogs()
  }, [clearLogs])

  const currentStepIndex = STEPS_ORDER.indexOf(step)

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS_ORDER.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                i < currentStepIndex
                  ? 'bg-green-500 text-white'
                  : i === currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < currentStepIndex ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`text-sm ${i === currentStepIndex ? 'font-medium' : 'text-muted-foreground'}`}
            >
              {STEP_LABELS[s]}
            </span>
            {i < STEPS_ORDER.length - 1 && (
              <div className={`w-8 h-0.5 ${i < currentStepIndex ? 'bg-green-500' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Log feed */}
      <LogFeed logs={logs} />

      {/* Step content */}
      {step === 'address' && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Seleccionar ubicación</CardTitle>
          </CardHeader>
          <CardContent>
            <WizardAddress onResolved={handleAddressResolved} onAddLog={addLog} />
          </CardContent>
        </Card>
      )}

      {step === 'radius' && geoResult && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 2: Seleccionar radio de búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <WizardRadius
              lat={geoResult.lat}
              lng={geoResult.lng}
              initialRadius={radius}
              onConfirm={handleRadiusConfirmed}
              onBack={() => setStep('address')}
            />
          </CardContent>
        </Card>
      )}

      {step === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 3: Seleccionar categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <WizardCategories
              onSearch={handleSearch}
              onBack={() => setStep('radius')}
              onAddLog={addLog}
              isSearching={isSearching}
            />
          </CardContent>
        </Card>
      )}

      {step === 'results' && (
        <WizardResults
          places={searchResults}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          onSelectForImport={handleSelectForImport}
          onImportAll={handleImportAll}
          onBack={() => setStep('categories')}
        />
      )}

      {step === 'preview' && (
        <GoogleImportPreview
          places={selectedForImport}
          duplicates={duplicates}
          categories={categories}
          onImport={handleDirectImport}
          onCancel={() => setStep('results')}
          isImporting={isImporting}
        />
      )}

      {step === 'job' && activeJobId && (
        <JobProgress
          jobId={activeJobId}
          onDone={() => {
            toast.success('Importación completada')
            addLog(createLog('success', 'Importación completada'))
          }}
        />
      )}

      <BulkImportConfirm
        open={showBulkConfirm}
        totalRecords={selectedForImport.length}
        onConfirm={handleBulkImport}
        onCancel={() => setShowBulkConfirm(false)}
        isLoading={isCreatingJob}
      />
    </div>
  )
}

export const GooglePlacesImport = GooglePlacesWizard
