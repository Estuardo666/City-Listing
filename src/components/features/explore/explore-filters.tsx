'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown, Clock, LayoutList, Locate, MapPin, Navigation,
  Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Tag, Ticket, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExploreFilters, UserLocation } from '@/types/explore'
import { PROXIMITY_STEPS } from '@/types/explore'
import { CategorySearcher } from './category-searcher'
import {
  RATING_OPTIONS, PRICE_RANGE_OPTIONS, FOOD_TYPE_OPTIONS,
  EVENT_DATE_PRESETS, EVENT_TYPE_OPTIONS, FILTER_SERVICES,
} from '@/lib/constants/filters'
import { GASTRONOMIC_CATEGORY_SLUGS } from '@/lib/constants/services'

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
  variant?: 'sidebar' | 'drawer'
  onClose?: () => void
  userLocation: UserLocation | null
  proximityRadius: number | null
  onRequestLocation: () => void
  onClearLocation: () => void
  onProximityChange: (meters: number) => void
  locationLoading?: boolean
  mode?: 'all' | 'venues' | 'events'
  showProximity?: boolean
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
        className="flex w-full shrink-0 items-center justify-between py-3 text-left transition-colors hover:text-foreground"
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
              className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-white"
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

// ── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 px-3 py-2.5">
      <span className="text-xs text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-border'
        )}
      >
        <motion.span
          animate={{ x: checked ? 16 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  )
}

// ── Pill group ───────────────────────────────────────────────────────────────

function PillGroup({
  options,
  value,
  onChange,
  multiple = false,
}: {
  options: { value: string; label: string; icon?: string }[]
  value: string | string[] | null
  onChange: (v: string | string[] | null) => void
  multiple?: boolean
}) {
  const isSelected = (v: string) =>
    multiple ? Array.isArray(value) && value.includes(v) : value === v

  const handleClick = (v: string) => {
    if (multiple) {
      const arr = Array.isArray(value) ? value : []
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
    } else {
      onChange(value === v ? null : v)
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleClick(opt.value)}
          className={cn(
            'rounded-lg border px-2.5 py-1.5 chip-14 font-medium transition-all whitespace-nowrap',
            isSelected(opt.value)
              ? 'border-primary/30 bg-primary text-white'
              : 'border-border/60 bg-secondary/40 text-foreground hover:border-primary/40 hover:text-primary'
          )}
        >
          {opt.icon && <span className="mr-1">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
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
  mode = 'all',
  showProximity = true,
}: ExploreFiltersProps) {
  const hasActiveFilters =
    filters.q !== '' || filters.category !== '' || filters.featured ||
    filters.type !== 'all' || proximityRadius !== null ||
    filters.minRating !== null || filters.openNow || filters.verified ||
    filters.hasPromotions || filters.hasUpcomingEvents ||
    filters.priceRange !== null || filters.services.length > 0 ||
    filters.foodTypes.length > 0 || filters.eventDatePreset !== null ||
    filters.eventPrice !== null || filters.eventType !== null

  const typeBadge = filters.type !== 'all' ? 1 : 0
  const featuredBadge = filters.featured ? 1 : 0
  const categoryBadge = filters.category !== '' ? 1 : 0
  const ratingBadge = filters.minRating !== null ? 1 : 0
  const venueFiltersBadge =
    (filters.openNow ? 1 : 0) + (filters.verified ? 1 : 0) +
    (filters.hasPromotions ? 1 : 0) + (filters.hasUpcomingEvents ? 1 : 0) +
    (filters.priceRange !== null ? 1 : 0) + filters.services.length + filters.foodTypes.length
  const eventFiltersBadge =
    (filters.eventDatePreset !== null ? 1 : 0) +
    (filters.eventPrice !== null ? 1 : 0) +
    (filters.eventType !== null ? 1 : 0)

  const isDrawer = variant === 'drawer'
  const showTypeSelector = mode === 'all'
  const showVenueFilters = mode === 'venues' || (mode === 'all' && filters.type !== 'events')
  const showEventFilters = mode === 'events' || (mode === 'all' && filters.type !== 'venues')
  const isGastronomic = !filters.category || GASTRONOMIC_CATEGORY_SLUGS.includes(filters.category)

  return (
    <div className={cn('flex h-full flex-col', isDrawer ? 'gap-0' : 'gap-1')}>
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

      {/* ── Search ── */}
      <div className={cn('relative', isDrawer ? 'mb-3' : 'mb-4')}>
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="text"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder={mode === 'venues' ? 'Buscar locales...' : mode === 'events' ? 'Buscar eventos...' : 'Buscar lugares, eventos...'}
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
      <div className={cn('flex-1 flex flex-col', isDrawer ? 'overflow-y-auto' : '')}>
        {/* Tipo — only shown in 'all' mode */}
        {showTypeSelector && (
          <AccordionSection title="Tipo" icon={<LayoutList className="h-3.5 w-3.5" />} badge={typeBadge}>
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
        )}

        {/* Cerca de mí — hidden when showProximity is false (moved to map bottom bar) */}
        {showProximity !== false && (
          <AccordionSection
            title="Cerca de mí"
            icon={<MapPin className="h-3.5 w-3.5" />}
            badge={proximityRadius !== null ? 1 : 0}
            defaultOpen={true}
          >
            <div className="space-y-3">
              {!userLocation ? (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={onRequestLocation}
                  disabled={locationLoading}
                  className={cn(
                    'flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/8 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/12',
                    locationLoading && 'cursor-wait opacity-70'
                  )}
                >
                  {locationLoading ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="inline-block"
                    >
                      <Locate className="h-3.5 w-3.5" />
                    </motion.span>
                  ) : (
                    <Locate className="h-3.5 w-3.5" />
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
        )}

        {/* Calificación */}
        <AccordionSection
          title="Calificación"
          icon={<Star className="h-3.5 w-3.5" />}
          badge={ratingBadge}
          defaultOpen={false}
        >
          <PillGroup
            options={RATING_OPTIONS.map((r) => ({ value: String(r.value), label: `${r.stars} ${r.label}` }))}
            value={filters.minRating !== null ? String(filters.minRating) : null}
            onChange={(v) => onChange({ minRating: v ? Number(v) : null })}
          />
        </AccordionSection>

        {/* Filtros de negocio */}
        {showVenueFilters && (
          <AccordionSection
            title="Filtros de negocio"
            icon={<Navigation className="h-3.5 w-3.5" />}
            badge={venueFiltersBadge}
            defaultOpen={false}
          >
            <div className="space-y-4">
              {/* Toggles */}
              <div className="space-y-2">
                <ToggleSwitch
                  checked={filters.openNow}
                  onChange={(v) => onChange({ openNow: v })}
                  label="Abierto ahora"
                />
                <ToggleSwitch
                  checked={filters.verified}
                  onChange={(v) => onChange({ verified: v })}
                  label="Solo verificados"
                />
                <ToggleSwitch
                  checked={filters.hasPromotions}
                  onChange={(v) => onChange({ hasPromotions: v })}
                  label="Con promociones"
                />
                <ToggleSwitch
                  checked={filters.hasUpcomingEvents}
                  onChange={(v) => onChange({ hasUpcomingEvents: v })}
                  label="Con eventos próximos"
                />
              </div>

              {/* Rango de precios */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Rango de precios</span>
                <PillGroup
                  options={PRICE_RANGE_OPTIONS.map((p) => ({ value: p.value, label: p.label }))}
                  value={filters.priceRange}
                  onChange={(v) => onChange({ priceRange: v as string | null })}
                />
              </div>

              {/* Servicios */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Servicios</span>
                <PillGroup
                  options={FILTER_SERVICES.map((s) => ({ value: s, label: s }))}
                  value={filters.services}
                  onChange={(v) => onChange({ services: (v as string[]) || [] })}
                  multiple
                />
              </div>

              {/* Tipo de comida (only for gastronomic categories) */}
              {isGastronomic && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Tipo de comida</span>
                  <PillGroup
                    options={FOOD_TYPE_OPTIONS.map((f) => ({ value: f, label: f }))}
                    value={filters.foodTypes}
                    onChange={(v) => onChange({ foodTypes: (v as string[]) || [] })}
                    multiple
                  />
                </div>
              )}
            </div>
          </AccordionSection>
        )}

        {/* Filtros de eventos */}
        {showEventFilters && (
          <AccordionSection
            title="Filtros de eventos"
            icon={<Ticket className="h-3.5 w-3.5" />}
            badge={eventFiltersBadge}
            defaultOpen={false}
          >
            <div className="space-y-4">
              {/* Fecha */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Fecha</span>
                <PillGroup
                  options={EVENT_DATE_PRESETS.map((d) => ({ value: d.value, label: d.label }))}
                  value={filters.eventDatePreset}
                  onChange={(v) => onChange({ eventDatePreset: v as string | null })}
                />
              </div>

              {/* Precio */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Precio</span>
                <PillGroup
                  options={[
                    { value: 'free', label: 'Gratis' },
                    { value: 'paid', label: 'Pagado' },
                  ]}
                  value={filters.eventPrice}
                  onChange={(v) => onChange({ eventPrice: v as 'free' | 'paid' | null })}
                />
              </div>

              {/* Tipo de evento */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Tipo de evento</span>
                <PillGroup
                  options={EVENT_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label, icon: t.icon }))}
                  value={filters.eventType}
                  onChange={(v) => onChange({ eventType: v as string | null })}
                />
              </div>
            </div>
          </AccordionSection>
        )}

        {/* Destacados */}
        <AccordionSection
          title="Destacados"
          icon={<Sparkles className="h-3.5 w-3.5 text-coral" />}
          badge={featuredBadge}
          defaultOpen={false}
        >
          <ToggleSwitch
            checked={filters.featured}
            onChange={(v) => onChange({ featured: v })}
            label="Solo destacados"
          />
        </AccordionSection>

        {/* Categorías */}
        {categories.length > 0 && (
          <AccordionSection
            title="Categoría"
            icon={<Tag className="h-3.5 w-3.5" />}
            badge={categoryBadge}
            defaultOpen={true}
          >
            <CategorySearcher
              categories={categories}
              selectedCategory={filters.category}
              onCategoryChange={(category) => onChange({ category })}
            />
          </AccordionSection>
        )}
      </div>

      {/* ── Footer ── */}
      {isDrawer ? (
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
