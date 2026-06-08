'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { GoogleImportForm } from './google-import-form'
import { GoogleImportResults, type PlaceResult } from './google-import-results'
import { GoogleImportPreview } from './google-import-preview'
import { BulkImportConfirm } from './bulk-import-confirm'
import { JobProgress } from './job-progress'
import type { GoogleSearchInput } from '@/schemas/google-import'
import type { DuplicateCheckResult } from '@/types/google-import'

interface Category {
  id: string
  name: string
  slug: string
}

type View = 'search' | 'results' | 'preview' | 'job'

export function GooglePlacesImport({ categories }: { categories: Category[] }) {
  const [view, setView] = useState<View>('search')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceResult[]>([])
  const [duplicates, setDuplicates] = useState<Map<string, DuplicateCheckResult>>(new Map())
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [isCreatingJob, setIsCreatingJob] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [lastSearchParams, setLastSearchParams] = useState<GoogleSearchInput | null>(null)

  const handleSearch = useCallback(async (data: GoogleSearchInput) => {
    setIsSearching(true)
    setLastSearchParams(data)

    try {
      const params = new URLSearchParams({
        city: data.city,
        province: data.province,
        country: data.country,
        categories: data.categories.join(','),
        radius: data.radius.toString(),
      })

      const res = await fetch(`/api/admin/imports/google/search?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al buscar')
      }

      const result = await res.json()
      setSearchResults(result.data)

      if (result.data.length === 0) {
        toast.info('No se encontraron negocios con esos criterios')
      } else {
        toast.success(`Se encontraron ${result.data.length} negocios`)
        setView('results')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al buscar')
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSelectForImport = useCallback(
    (places: PlaceResult[]) => {
      if (places.length === 0) return

      if (places.length > 500) {
        setSelectedPlaces(places)
        setShowBulkConfirm(true)
        return
      }

      setSelectedPlaces(places)
      setView('preview')
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
      setSelectedPlaces(available)
      setShowBulkConfirm(true)
      return
    }

    setSelectedPlaces(available)
    setView('preview')
  }, [searchResults])

  const handleDirectImport = useCallback(
    async (places: PlaceResult[], categoryId: string, duplicateAction: 'skip' | 'update') => {
      setIsImporting(true)

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
            categoryId,
            duplicateAction,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al importar')
        }

        const result = await res.json()
        toast.success(
          `Importados: ${result.stats.imported}, Duplicados: ${result.stats.skipped}, Errores: ${result.stats.errors}`
        )

        setView('search')
        setSearchResults([])
        setSelectedPlaces([])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Error al importar')
      } finally {
        setIsImporting(false)
      }
    },
    []
  )

  const handleBulkImport = useCallback(async () => {
    if (!lastSearchParams) return

    setIsCreatingJob(true)

    try {
      const res = await fetch('/api/admin/imports/google/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          places: selectedPlaces.map((p) => ({
            google_place_id: p.google_place_id,
            name: p.name,
            category: p.category,
            address: p.address,
            phone: p.phone,
            lat: p.lat,
            lng: p.lng,
          })),
          categoryId: categories[0]?.id || '',
          duplicateAction: 'skip',
          country: lastSearchParams.country,
          province: lastSearchParams.province,
          city: lastSearchParams.city,
          categories: lastSearchParams.categories,
          radius: lastSearchParams.radius,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear job')
      }

      const result = await res.json()
      toast.success('Job de importación creado')
      setActiveJobId(result.jobId)
      setView('job')
      setShowBulkConfirm(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear job')
    } finally {
      setIsCreatingJob(false)
    }
  }, [selectedPlaces, lastSearchParams, categories])

  const handleCancel = useCallback(() => {
    setView('search')
    setSearchResults([])
    setSelectedPlaces([])
    setDuplicates(new Map())
  }, [])

  return (
    <div className="space-y-6">
      {view === 'search' && <GoogleImportForm onSearch={handleSearch} isSearching={isSearching} />}

      {view === 'results' && (
        <GoogleImportResults
          places={searchResults}
          onSelectForImport={handleSelectForImport}
          onImportAll={handleImportAll}
          onCancel={handleCancel}
        />
      )}

      {view === 'preview' && (
        <GoogleImportPreview
          places={selectedPlaces}
          duplicates={duplicates}
          categories={categories}
          onImport={handleDirectImport}
          onCancel={handleCancel}
          isImporting={isImporting}
        />
      )}

      {view === 'job' && activeJobId && (
        <JobProgress
          jobId={activeJobId}
          onDone={() => {
            toast.success('Importación completada')
          }}
        />
      )}

      <BulkImportConfirm
        open={showBulkConfirm}
        totalRecords={selectedPlaces.length}
        onConfirm={handleBulkImport}
        onCancel={() => setShowBulkConfirm(false)}
        isLoading={isCreatingJob}
      />
    </div>
  )
}
