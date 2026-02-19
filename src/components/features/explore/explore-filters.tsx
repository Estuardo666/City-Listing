'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Locate, Navigation, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExploreFilters, UserLocation } from '@/types/explore'
import { PROXIMITY_STEPS } from '@/types/explore'

type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
}

type ExploreFiltersProps = {
  filters: ExploreFilters
  categories: Category[]
  totalResults: number
  onChange: (filters: Partial<ExploreFilters>) => void
  onReset: () => void
  /** 'sidebar' = desktop panel, 'drawer' = mobile bottom sheet */
  variant?: 'sidebar' | 'drawer'
  /** Called when user clicks "Ver resultados" in drawer mode */
  onClose?: () => void
  userLocation: UserLocation | null
  proximityRadius: number | null
  onRequestLocation: () => void
  onClearLocation: () => void
  onProximityChange: (meters: number) => void
  locationLoading?: boolean
}

const TYPE_OPTIONS: { value: ExploreFilters['type']; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'venues', label: 'Locales' },
  { value: 'events', label: 'Eventos' },
]

// ── Accordion section ────────────────────────────────────────────────────────

function AccordionSection({
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string
  icon?: React.ReactNode
  badge?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-left transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="text-sm font-medium text-foreground">{title}</span>
          {badge != null && badge > 0 && (
            <motion.span
              key={badge}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"
            >
              {badge}
            </motion.span>
          )}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="ml-2 shrink-0 text-muted-foreground/60"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main filter panel ─────────────────────────────────────────────────────────

function formatRadius(m: number): string {
  return m >= 1000 ? `${m / 1000} km` : `${m} m`
}

export function ExploreFiltersPanel({
  filters,
  categories,
  totalResults,
  onChange,
  onReset,
  variant = 'sidebar',
  onClose,
  userLocation,
  proximityRadius,
  onRequestLocation,
  onClearLocation,
  onProximityChange,
  locationLoading = false,
}: ExploreFiltersProps) {
  const hasActiveFilters =
    filters.q !== '' || filters.category !== '' || filters.featured || filters.type !== 'all' || proximityRadius !== null

  // Badge counts per section
  const typeBadge = filters.type !== 'all' ? 1 : 0
  const featuredBadge = filters.featured ? 1 : 0
  const categoryBadge = filters.category !== '' ? 1 : 0

  const isDrawer = variant === 'drawer'

  return (
    <div className={cn('flex h-full flex-col', isDrawer ? 'gap-0' : 'gap-1 overflow-y-auto')}>
      {/* ── Header ── */}
      <div className={cn('flex items-center justify-between', isDrawer ? 'mb-2' : 'mb-3')}>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Filtros</span>
        </div>
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Limpiar
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Search (always visible, outside accordion) ── */}
      <div className={cn('relative', isDrawer ? 'mb-3' : 'mb-4')}>
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="text"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Buscar lugares, eventos..."
          className="h-9 w-full rounded-xl border border-border/60 bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
        <AnimatePresence>
          {filters.q && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={() => onChange({ q: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Accordion sections ── */}
      <div className={cn('flex-1', isDrawer ? 'overflow-y-auto' : '')}>
        {/* Tipo */}
        <AccordionSection
          title="Tipo"
          badge={typeBadge}
          defaultOpen={true}
        >
          <div className="flex gap-1.5 rounded-xl border border-border/60 bg-secondary/40 p-1">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ type: opt.value })}
                className={cn(
                  'relative flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors',
                  filters.type === opt.value
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {filters.type === opt.value && (
                  <motion.span
                    layoutId={isDrawer ? 'type-pill-drawer' : 'type-pill'}
                    className="absolute inset-0 rounded-lg bg-card shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{opt.label}</span>
              </button>
            ))}
          </div>
        </AccordionSection>

        {/* Destacados */}
        <AccordionSection
          title="Destacados"
          icon={<Sparkles className="h-3.5 w-3.5 text-coral" />}
          badge={featuredBadge}
          defaultOpen={true}
        >
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 px-3 py-2.5">
            <span className="text-sm text-foreground">Solo destacados</span>
            <button
              type="button"
              role="switch"
              aria-checked={filters.featured}
              onClick={() => onChange({ featured: !filters.featured })}
              className={cn(
                'relative h-5 w-9 rounded-full transition-colors duration-200',
                filters.featured ? 'bg-coral' : 'bg-border'
              )}
            >
              <motion.span
                animate={{ x: filters.featured ? 16 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>
        </AccordionSection>

        {/* Proximidad */}
        <AccordionSection
          title="Proximidad"
          icon={<Navigation className="h-3.5 w-3.5" />}
          badge={proximityRadius !== null ? 1 : 0}
          defaultOpen={false}
        >
          <div className="space-y-3">
            {!userLocation ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={onRequestLocation}
                disabled={locationLoading}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/8 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/12',
                  locationLoading && 'cursor-wait opacity-70'
                )}
              >
                {locationLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="inline-block"
                  >
                    <Locate className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <Locate className="h-4 w-4" />
                )}
                {locationLoading ? 'Obteniendo ubicación...' : 'Usar mi ubicación'}
              </motion.button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Ubicación activa
                  </div>
                  <button
                    type="button"
                    onClick={onClearLocation}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                    Quitar
                  </button>
                </div>

                {/* Radius slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Radio de búsqueda</span>
                    <span className="text-xs font-semibold text-primary">
                      {proximityRadius !== null ? formatRadius(proximityRadius) : formatRadius(PROXIMITY_STEPS[1])}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={PROXIMITY_STEPS.length - 1}
                    step={1}
                    value={PROXIMITY_STEPS.indexOf(proximityRadius ?? PROXIMITY_STEPS[1])}
                    onChange={(e) => onProximityChange(PROXIMITY_STEPS[Number(e.target.value)])}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/60">
                    {PROXIMITY_STEPS.map((s) => (
                      <span key={s}>{formatRadius(s)}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Categorías */}
        {categories.length > 0 && (
          <AccordionSection
            title="Categoría"
            badge={categoryBadge}
            defaultOpen={!isDrawer}
          >
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onChange({ category: '' })}
                className={cn(
                  'col-span-2 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all',
                  filters.category === ''
                    ? 'border-primary/30 bg-primary text-white'
                    : 'border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:text-primary'
                )}
              >
                Todas las categorías
              </button>
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    onChange({ category: filters.category === cat.slug ? '' : cat.slug })
                  }
                  className={cn(
                    'rounded-full border px-2 py-1 text-xs font-medium transition-all text-left',
                    filters.category === cat.slug
                      ? 'border-primary bg-primary text-white'
                      : 'border-border/60 bg-secondary/40 text-foreground hover:border-primary/40 hover:bg-primary/8 hover:text-primary'
                  )}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.name}
                </motion.button>
              ))}
            </div>
          </AccordionSection>
        )}
      </div>

      {/* ── Footer ── */}
      {isDrawer ? (
        /* Drawer CTA */
        <div className="mt-4 pt-3 border-t border-border/40">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
          >
            Ver {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
          </button>
        </div>
      ) : (
        /* Sidebar results count */
        <div className="mt-auto pt-4">
          <div className="rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{totalResults}</span>{' '}
              {totalResults === 1 ? 'resultado' : 'resultados'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
