'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  FileText,
  ImageIcon,
  Loader2,
  MapPin,
  Search,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchEvent = {
  id: string
  title: string
  slug: string
  image: string | null
  startDate: string
  location: string
  category: { name: string; color: string | null }
}

type SearchVenue = {
  id: string
  name: string
  slug: string
  image: string | null
  location: string
  category: { name: string; color: string | null }
}

type SearchPost = {
  id: string
  title: string
  slug: string
  image: string | null
  publishedAt: string | null
  category: { name: string; color: string | null }
}

type SearchResults = {
  events: SearchEvent[]
  venues: SearchVenue[]
  posts: SearchPost[]
}

const EMPTY: SearchResults = { events: [], venues: [], posts: [] }

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const allItems = [
    ...results.events.map((e) => ({ type: 'event' as const, item: e, href: `/eventos/${e.slug}`, label: e.title })),
    ...results.venues.map((v) => ({ type: 'venue' as const, item: v, href: `/locales/${v.slug}`, label: v.name })),
    ...results.posts.map((p) => ({ type: 'post' as const, item: p, href: `/blog/${p.slug}`, label: p.title })),
  ]

  const openPalette = useCallback(() => {
    setOpen(true)
    setQuery('')
    setResults(EMPTY)
    setActiveIndex(0)
  }, [])

  const closePalette = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults(EMPTY)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (open) closePalette()
        else openPalette()
      }
      if (e.key === 'Escape' && open) closePalette()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, openPalette, closePalette])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || query.trim().length < 2) {
      setResults(EMPTY)
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/global?q=${encodeURIComponent(query.trim())}`)
        if (!res.ok) throw new Error()
        const data: SearchResults = await res.json()
        setResults(data)
        setActiveIndex(0)
      } catch {
        setResults(EMPTY)
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && allItems[activeIndex]) {
      router.push(allItems[activeIndex].href)
      closePalette()
    }
  }

  function navigate(href: string) {
    router.push(href)
    closePalette()
  }

  const hasResults = allItems.length > 0
  const showEmpty = !loading && query.trim().length >= 2 && !hasResults

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            onClick={closePalette}
          />

          {/* Panel */}
          <motion.div
            key="cp-panel"
            initial={{ opacity: 0, scale: 0.97, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="fixed inset-x-4 top-[10vh] z-[201] mx-auto max-w-xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl"
          >
            {/* Input row */}
            <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
              {loading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar eventos, locales, artículos…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <kbd className="hidden rounded border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                  ESC
                </kbd>
                <button
                  onClick={closePalette}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto overscroll-contain py-2">
              {/* Hint */}
              {!query.trim() && (
                <div className="px-4 py-8 text-center">
                  <Search className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Escribe para buscar en toda la plataforma</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Eventos · Locales · Artículos</p>
                </div>
              )}

              {/* Too short */}
              {query.trim().length === 1 && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">Escribe al menos 2 caracteres…</p>
              )}

              {/* Empty */}
              {showEmpty && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Sin resultados para <span className="font-medium text-foreground">"{query}"</span>
                </p>
              )}

              {/* Events */}
              {results.events.length > 0 && (
                <ResultSection label="Eventos" icon={<Calendar className="h-3 w-3" />}>
                  {results.events.map((e, i) => {
                    const globalIdx = i
                    return (
                      <ResultRow
                        key={e.id}
                        image={e.image}
                        title={e.title}
                        meta={e.location}
                        badge={e.category.name}
                        badgeColor={e.category.color}
                        active={activeIndex === globalIdx}
                        onHover={() => setActiveIndex(globalIdx)}
                        onClick={() => navigate(`/eventos/${e.slug}`)}
                      />
                    )
                  })}
                </ResultSection>
              )}

              {/* Venues */}
              {results.venues.length > 0 && (
                <ResultSection label="Locales" icon={<MapPin className="h-3 w-3" />}>
                  {results.venues.map((v, i) => {
                    const globalIdx = results.events.length + i
                    return (
                      <ResultRow
                        key={v.id}
                        image={v.image}
                        title={v.name}
                        meta={v.location}
                        badge={v.category.name}
                        badgeColor={v.category.color}
                        active={activeIndex === globalIdx}
                        onHover={() => setActiveIndex(globalIdx)}
                        onClick={() => navigate(`/locales/${v.slug}`)}
                      />
                    )
                  })}
                </ResultSection>
              )}

              {/* Posts */}
              {results.posts.length > 0 && (
                <ResultSection label="Artículos" icon={<FileText className="h-3 w-3" />}>
                  {results.posts.map((p, i) => {
                    const globalIdx = results.events.length + results.venues.length + i
                    return (
                      <ResultRow
                        key={p.id}
                        image={p.image}
                        title={p.title}
                        meta={p.publishedAt ? new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(p.publishedAt)) : undefined}
                        badge={p.category.name}
                        badgeColor={p.category.color}
                        active={activeIndex === globalIdx}
                        onHover={() => setActiveIndex(globalIdx)}
                        onClick={() => navigate(`/blog/${p.slug}`)}
                      />
                    )
                  })}
                </ResultSection>
              )}
            </div>

            {/* Footer */}
            {hasResults && (
              <div className="flex items-center gap-3 border-t border-border/50 px-4 py-2">
                <span className="text-[10px] text-muted-foreground">
                  <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono">↑↓</kbd> navegar
                </span>
                <span className="text-[10px] text-muted-foreground">
                  <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono">↵</kbd> abrir
                </span>
                <span className="text-[10px] text-muted-foreground">
                  <kbd className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono">ESC</kbd> cerrar
                </span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function ResultSection({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 px-4 pb-1 pt-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      {children}
    </div>
  )
}

function ResultRow({
  image,
  title,
  meta,
  badge,
  badgeColor,
  active,
  onHover,
  onClick,
}: {
  image: string | null
  title: string
  meta?: string
  badge: string
  badgeColor: string | null
  active: boolean
  onHover: () => void
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
        active ? 'bg-accent' : 'hover:bg-accent/50'
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
        {image ? (
          <Image src={image} alt={title} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
          </div>
        )}
      </div>
      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
      </div>
      {/* Badge */}
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={
          badgeColor
            ? { backgroundColor: `${badgeColor}20`, color: badgeColor }
            : undefined
        }
      >
        {badge}
      </span>
    </button>
  )
}
