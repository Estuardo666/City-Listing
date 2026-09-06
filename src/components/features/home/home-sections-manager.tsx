'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createHomeSectionAction,
  deleteHomeSectionAction,
  reorderHomeSectionsAction,
  toggleHomeSectionAction,
  updateHomeSectionAction,
} from '@/actions/home/manage-home-sections'
import {
  defaultLayoutForType,
  homeSectionLayoutSchema,
  homeSectionPlatformSchema,
  homeSectionTypeSchema,
  type HomeSectionLayout,
  type HomeSectionPlatform,
  type HomeSectionType,
} from '@/schemas/home-section.schema'

export type HomeSectionListItem = {
  id: string
  type: string
  title: string
  subtitle: string | null
  actionLabel: string | null
  layout: string
  params: Record<string, unknown> | null
  order: number
  isActive: boolean
  platform: string
  startsAt: string | null
  endsAt: string | null
}

type Option = { slug: string; name: string }

type Props = {
  sections: HomeSectionListItem[]
  categories: Array<Option & { type: string }>
  collections: Option[]
}

const TYPE_LABELS: Record<HomeSectionType, string> = {
  hero: 'Hero',
  todayInLoja: 'Hoy en Loja',
  categoryChips: 'Chips de categoria',
  venueList: 'Locales',
  openNow: 'Abiertos ahora',
  eventList: 'Eventos',
  ranked: 'Top / Ranking',
  collection: 'Coleccion',
  promotions: 'Promociones',
  posts: 'Blog',
  routes: 'Rutas',
  manual: 'Seleccion manual',
}

const LAYOUT_LABELS: Record<HomeSectionLayout, string> = {
  hero: 'Hero',
  chips: 'Chips',
  carousel: 'Carrusel',
  ranked: 'Ranking numerado',
  grid: 'Cuadricula',
  list: 'Lista',
}

const PLATFORM_LABELS: Record<HomeSectionPlatform, string> = {
  all: 'App y web',
  ios: 'Solo app',
  web: 'Solo web',
}

const VENUE_SORTS = [
  { value: 'recent', label: 'Mas recientes' },
  { value: 'popular', label: 'Mas vistos' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'featured', label: 'Destacados primero' },
]

const EVENT_SORTS = [
  { value: 'soon', label: 'Proximos' },
  { value: 'recent', label: 'Mas recientes' },
  { value: 'popular', label: 'Mas vistos' },
  { value: 'featured', label: 'Destacados primero' },
]

const DATE_RANGES = [
  { value: 'all', label: 'Sin limite' },
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
]

type Draft = {
  id: string | null
  type: HomeSectionType
  title: string
  subtitle: string
  actionLabel: string
  layout: HomeSectionLayout
  platform: HomeSectionPlatform
  isActive: boolean
  params: Record<string, unknown>
}

function emptyDraft(): Draft {
  return {
    id: null,
    type: 'venueList',
    title: '',
    subtitle: '',
    actionLabel: 'Ver todo',
    layout: defaultLayoutForType.venueList,
    platform: 'all',
    isActive: true,
    params: { sort: 'recent', limit: 12 },
  }
}

function draftFrom(section: HomeSectionListItem): Draft {
  const type = section.type as HomeSectionType
  return {
    id: section.id,
    type,
    title: section.title,
    subtitle: section.subtitle ?? '',
    actionLabel: section.actionLabel ?? '',
    layout: (section.layout as HomeSectionLayout) ?? defaultLayoutForType[type],
    platform: (section.platform as HomeSectionPlatform) ?? 'all',
    isActive: section.isActive,
    params: (section.params as Record<string, unknown>) ?? {},
  }
}

const inputClass =
  'w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40'

export function HomeSectionsManager({ sections, categories, collections }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [draft, setDraft] = useState<Draft | null>(null)

  // Local mirror so reordering feels immediate; the server is the source of
  // truth and `router.refresh()` reconciles right after.
  const [order, setOrder] = useState(() => sections.map((section) => section.id))
  const ordered = useMemo(() => {
    const byId = new Map(sections.map((section) => [section.id, section]))
    const known = order.flatMap((id) => (byId.get(id) ? [byId.get(id)!] : []))
    const missing = sections.filter((section) => !order.includes(section.id))
    return [...known, ...missing]
  }, [order, sections])

  function run(action: () => Promise<{ success: boolean; error?: string }>, okMessage: string) {
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        toast.success(okMessage)
        router.refresh()
      } else {
        toast.error(result.error ?? 'No se pudo completar la accion')
      }
    })
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...ordered.map((section) => section.id)]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrder(next)
    run(() => reorderHomeSectionsAction(next), 'Orden actualizado')
  }

  function save() {
    if (!draft) return
    const payload = {
      type: draft.type,
      title: draft.title,
      subtitle: draft.subtitle || null,
      actionLabel: draft.actionLabel || null,
      layout: draft.layout,
      platform: draft.platform,
      isActive: draft.isActive,
      params: draft.params,
    }
    const isNew = draft.id === null
    run(
      () => (isNew ? createHomeSectionAction(payload) : updateHomeSectionAction(draft.id!, payload)),
      isNew ? 'Seccion creada' : 'Seccion guardada',
    )
    setDraft(null)
  }

  /** Curated shortlist of categories, capped by the schema at ten. */
  function toggleCategorySlug(slugValue: string, max: number) {
    setDraft((current) => {
      if (!current) return current
      const selected = Array.isArray(current.params.categorySlugs)
        ? (current.params.categorySlugs as string[])
        : []
      const next = selected.includes(slugValue)
        ? selected.filter((value) => value !== slugValue)
        : selected.length >= max
          ? selected
          : [...selected, slugValue]
      return { ...current, params: { ...current.params, categorySlugs: next.length ? next : undefined } }
    })
  }

  function patchParams(patch: Record<string, unknown>) {
    setDraft((current) => (current ? { ...current, params: { ...current.params, ...patch } } : current))
  }

  const venueCategories = categories.filter((category) => category.type === 'VENUE')
  const eventCategories = categories.filter((category) => category.type === 'EVENT')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{ordered.length} secciones configuradas</p>
        <button
          type="button"
          onClick={() => setDraft(emptyDraft())}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background"
        >
          <Plus className="h-4 w-4" /> Nueva seccion
        </button>
      </div>

      <div className="space-y-2">
        {ordered.map((section, index) => (
          <div
            key={section.id}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3"
          >
            <div className="flex flex-col">
              <button
                type="button"
                aria-label="Subir"
                disabled={index === 0 || pending}
                onClick={() => move(index, -1)}
                className="rounded p-1 text-muted-foreground disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Bajar"
                disabled={index === ordered.length - 1 || pending}
                onClick={() => move(index, 1)}
                className="rounded p-1 text-muted-foreground disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{section.title}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {TYPE_LABELS[section.type as HomeSectionType] ?? section.type}
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {LAYOUT_LABELS[section.layout as HomeSectionLayout] ?? section.layout}
                </span>
                {section.platform !== 'all' && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-600">
                    {PLATFORM_LABELS[section.platform as HomeSectionPlatform]}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {section.subtitle ?? JSON.stringify(section.params ?? {})}
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={section.isActive}
                disabled={pending}
                onChange={(event) =>
                  run(
                    () => toggleHomeSectionAction(section.id, event.target.checked),
                    event.target.checked ? 'Seccion activada' : 'Seccion oculta',
                  )
                }
              />
              Activa
            </label>

            <button
              type="button"
              aria-label="Editar"
              onClick={() => setDraft(draftFrom(section))}
              className="rounded-lg border border-border/60 p-2"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Eliminar"
              disabled={pending}
              onClick={() => {
                if (!confirm(`Eliminar la seccion "${section.title}"?`)) return
                run(() => deleteHomeSectionAction(section.id), 'Seccion eliminada')
              }}
              className="rounded-lg border border-border/60 p-2 text-rose-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {ordered.length === 0 && (
          <p className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            Aun no hay secciones. La app mostrara su composicion por defecto hasta que crees la primera.
          </p>
        )}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="mt-10 w-full max-w-2xl space-y-4 rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="text-lg font-medium">{draft.id ? 'Editar seccion' : 'Nueva seccion'}</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Tipo</span>
                <select
                  className={inputClass}
                  value={draft.type}
                  onChange={(event) => {
                    const type = event.target.value as HomeSectionType
                    setDraft({ ...draft, type, layout: defaultLayoutForType[type], params: {} })
                  }}
                >
                  {homeSectionTypeSchema.options.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Diseno</span>
                <select
                  className={inputClass}
                  value={draft.layout}
                  onChange={(event) => setDraft({ ...draft, layout: event.target.value as HomeSectionLayout })}
                >
                  {homeSectionLayoutSchema.options.map((layout) => (
                    <option key={layout} value={layout}>
                      {LAYOUT_LABELS[layout]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="text-muted-foreground">Titulo</span>
                <input
                  className={inputClass}
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  placeholder="Comer y beber"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Subtitulo</span>
                <input
                  className={inputClass}
                  value={draft.subtitle}
                  onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Texto de la accion</span>
                <input
                  className={inputClass}
                  value={draft.actionLabel}
                  onChange={(event) => setDraft({ ...draft, actionLabel: event.target.value })}
                  placeholder="Ver todo"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Donde se muestra</span>
                <select
                  className={inputClass}
                  value={draft.platform}
                  onChange={(event) =>
                    setDraft({ ...draft, platform: event.target.value as HomeSectionPlatform })
                  }
                >
                  {homeSectionPlatformSchema.options.map((platform) => (
                    <option key={platform} value={platform}>
                      {PLATFORM_LABELS[platform]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-end gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
                />
                <span>Visible</span>
              </label>
            </div>

            {/* Type-specific parameters. Each control writes into `params`, which
                the server validates against the schema for the chosen type. */}
            <div className="grid gap-3 rounded-xl bg-secondary/40 p-4 sm:grid-cols-2">
              {draft.type === 'hero' && (
                <>
                  <label className="space-y-1 text-sm sm:col-span-2">
                    <span className="text-muted-foreground">Texto</span>
                    <input
                      className={inputClass}
                      value={String(draft.params.body ?? '')}
                      onChange={(event) => patchParams({ body: event.target.value })}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">Boton</span>
                    <input
                      className={inputClass}
                      value={String(draft.params.ctaLabel ?? '')}
                      onChange={(event) => patchParams({ ctaLabel: event.target.value })}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">Destino</span>
                    <input
                      className={inputClass}
                      value={String(draft.params.ctaDeeplink ?? '')}
                      onChange={(event) => patchParams({ ctaDeeplink: event.target.value })}
                      placeholder="/explorar"
                    />
                  </label>
                </>
              )}

              {draft.type === 'venueList' && (
                <>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">Categoria</span>
                    <select
                      className={inputClass}
                      value={String(draft.params.categorySlug ?? '')}
                      onChange={(event) =>
                        patchParams({ categorySlug: event.target.value || undefined })
                      }
                    >
                      <option value="">Todas</option>
                      {venueCategories.map((category) => (
                        <option key={category.slug} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">Orden</span>
                    <select
                      className={inputClass}
                      value={String(draft.params.sort ?? 'recent')}
                      onChange={(event) => patchParams({ sort: event.target.value })}
                    >
                      {VENUE_SORTS.map((sort) => (
                        <option key={sort.value} value={sort.value}>
                          {sort.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.params.featured)}
                      onChange={(event) => patchParams({ featured: event.target.checked })}
                    />
                    Solo destacados
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.params.verified)}
                      onChange={(event) => patchParams({ verified: event.target.checked })}
                    />
                    Solo verificados
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.params.hasPromotion)}
                      onChange={(event) => patchParams({ hasPromotion: event.target.checked })}
                    />
                    Con promocion activa
                  </label>
                </>
              )}

              {draft.type === 'openNow' && (
                <div className="space-y-2 sm:col-span-2">
                  <span className="text-sm text-muted-foreground">
                    Categorias (maximo 10; vacio = todas)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {venueCategories.map((category) => {
                      const selected = (
                        (draft.params.categorySlugs as string[] | undefined) ?? []
                      ).includes(category.slug)
                      return (
                        <button
                          key={category.slug}
                          type="button"
                          onClick={() => toggleCategorySlug(category.slug, 10)}
                          className={`rounded-full border px-3 py-1.5 text-sm ${
                            selected
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border/60 text-muted-foreground'
                          }`}
                        >
                          {category.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {draft.type === 'eventList' && (
                <>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">Categoria</span>
                    <select
                      className={inputClass}
                      value={String(draft.params.categorySlug ?? '')}
                      onChange={(event) =>
                        patchParams({ categorySlug: event.target.value || undefined })
                      }
                    >
                      <option value="">Todas</option>
                      {eventCategories.map((category) => (
                        <option key={category.slug} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">Fechas</span>
                    <select
                      className={inputClass}
                      value={String(draft.params.dateRange ?? 'all')}
                      onChange={(event) => patchParams({ dateRange: event.target.value })}
                    >
                      {DATE_RANGES.map((range) => (
                        <option key={range.value} value={range.value}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">Orden</span>
                    <select
                      className={inputClass}
                      value={String(draft.params.sort ?? 'soon')}
                      onChange={(event) => patchParams({ sort: event.target.value })}
                    >
                      {EVENT_SORTS.map((sort) => (
                        <option key={sort.value} value={sort.value}>
                          {sort.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.params.featured)}
                      onChange={(event) => patchParams({ featured: event.target.checked })}
                    />
                    Solo destacados
                  </label>
                </>
              )}

              {draft.type === 'ranked' && (
                <>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">Contenido</span>
                    <select
                      className={inputClass}
                      value={String(draft.params.kind ?? 'venue')}
                      onChange={(event) => patchParams({ kind: event.target.value })}
                    >
                      <option value="venue">Locales</option>
                      <option value="event">Eventos</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-muted-foreground">Ventana</span>
                    <select
                      className={inputClass}
                      value={String(draft.params.window ?? '24h')}
                      onChange={(event) => patchParams({ window: event.target.value })}
                    >
                      <option value="24h">Ultimas 24 horas</option>
                      <option value="7d">Ultimos 7 dias</option>
                    </select>
                  </label>
                </>
              )}

              {draft.type === 'collection' && (
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">Coleccion</span>
                  <select
                    className={inputClass}
                    value={String(draft.params.slug ?? '')}
                    onChange={(event) => patchParams({ slug: event.target.value })}
                  >
                    <option value="">Elige una coleccion</option>
                    {collections.map((collection) => (
                      <option key={collection.slug} value={collection.slug}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {draft.type === 'posts' && (
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Etiqueta</span>
                  <input
                    className={inputClass}
                    value={String(draft.params.tagSlug ?? '')}
                    onChange={(event) => patchParams({ tagSlug: event.target.value || undefined })}
                    placeholder="slug de la etiqueta"
                  />
                </label>
              )}

              {(draft.type === 'routes' || draft.type === 'posts') && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.params.featured)}
                    onChange={(event) => patchParams({ featured: event.target.checked })}
                  />
                  Solo destacados
                </label>
              )}

              {draft.type === 'manual' && (
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">
                    Elementos (una linea por item, formato <code>tipo:id</code>)
                  </span>
                  <textarea
                    className={`${inputClass} min-h-[120px] font-mono text-xs`}
                    value={(Array.isArray(draft.params.items) ? draft.params.items : [])
                      .map((item) => `${(item as { kind: string }).kind}:${(item as { id: string }).id}`)
                      .join('\n')}
                    onChange={(event) =>
                      patchParams({
                        items: event.target.value
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .flatMap((line) => {
                            const [kind, id] = line.split(':')
                            return kind && id ? [{ kind, id }] : []
                          }),
                      })
                    }
                    placeholder={'venue:clx123...\nevent:clx456...'}
                  />
                </label>
              )}

              {draft.type !== 'hero' && draft.type !== 'todayInLoja' && draft.type !== 'manual' && (
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Cantidad</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    className={inputClass}
                    value={Number(draft.params.limit ?? 12)}
                    onChange={(event) => patchParams({ limit: Number(event.target.value) })}
                  />
                </label>
              )}

              {draft.type === 'todayInLoja' && (
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  Esta seccion la construye la app con los datos de Hoy en Loja. Aqui solo decides si
                  aparece y en que posicion.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-lg border border-border/60 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending || !draft.title.trim()}
                onClick={save}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
