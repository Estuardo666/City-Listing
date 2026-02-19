'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'
import { ExploreFiltersPanel } from './explore-filters'
import type { ExploreFilters, UserLocation } from '@/types/explore'

type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
}

type ExploreFilterDrawerProps = {
  open: boolean
  onClose: () => void
  filters: ExploreFilters
  categories: Category[]
  totalResults: number
  onChange: (filters: Partial<ExploreFilters>) => void
  onReset: () => void
  userLocation: UserLocation | null
  proximityRadius: number | null
  onRequestLocation: () => void
  onClearLocation: () => void
  onProximityChange: (meters: number) => void
  locationLoading?: boolean
}

export function ExploreFilterDrawer({
  open,
  onClose,
  filters,
  categories,
  totalResults,
  onChange,
  onReset,
  userLocation,
  proximityRadius,
  onRequestLocation,
  onClearLocation,
  onProximityChange,
  locationLoading = false,
}: ExploreFilterDrawerProps) {
  const dragControls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                onClose()
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[88dvh] flex-col rounded-t-2xl bg-card shadow-2xl"
            style={{ touchAction: 'none' }}
          >
            {/* Drag handle — triggers drag on pointer events */}
            <div
              className="flex cursor-grab touch-none items-center justify-center pb-3 pt-3 active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="h-1 w-10 rounded-full bg-border/60" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between border-b border-border/40 px-5 pb-3">
              <span className="text-base font-semibold text-foreground">Filtros</span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Cerrar filtros"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable filter content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-2">
              <ExploreFiltersPanel
                filters={filters}
                categories={categories}
                totalResults={totalResults}
                onChange={onChange}
                onReset={onReset}
                variant="drawer"
                onClose={onClose}
                userLocation={userLocation}
                proximityRadius={proximityRadius}
                onRequestLocation={onRequestLocation}
                onClearLocation={onClearLocation}
                onProximityChange={onProximityChange}
                locationLoading={locationLoading}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
