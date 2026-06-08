'use client'

import { useState } from 'react'
import { Search, Check, X, Edit2, Save, Filter } from 'lucide-react'

type Mapping = {
  id: string
  googleType: string
  categorySlugs: string[]
  subcategorySlugs: string[]
  confidence: number
  approved: boolean
}

type Category = {
  id: string
  name: string
  slug: string
  type: string
  icon: string | null
  subcategories: { id: string; name: string; slug: string }[]
}

type Props = {
  initialMappings: Mapping[]
  categories: Category[]
}

export function GoogleTypesManager({ initialMappings, categories }: Props) {
  const [mappings, setMappings] = useState(initialMappings)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'approved' | 'pending'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCategorySlugs, setEditCategorySlugs] = useState<string[]>([])
  const [editSubcategorySlugs, setEditSubcategorySlugs] = useState<string[]>([])

  const venueCategories = categories.filter((c) => c.type === 'VENUE')
  const eventCategories = categories.filter((c) => c.type === 'EVENT')

  const filtered = mappings.filter((m) => {
    const matchesSearch = m.googleType.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'approved' && m.approved) ||
      (filterType === 'pending' && !m.approved)
    return matchesSearch && matchesFilter
  })

  function startEdit(mapping: Mapping) {
    setEditingId(mapping.id)
    setEditCategorySlugs(mapping.categorySlugs)
    setEditSubcategorySlugs(mapping.subcategorySlugs)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditCategorySlugs([])
    setEditSubcategorySlugs([])
  }

  async function saveEdit(mappingId: string) {
    const res = await fetch('/api/admin/google-types', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: mappingId,
        categorySlugs: editCategorySlugs,
        subcategorySlugs: editSubcategorySlugs,
        approved: true,
        confidence: 100,
      }),
    })

    if (res.ok) {
      setMappings((prev) =>
        prev.map((m) =>
          m.id === mappingId
            ? { ...m, categorySlugs: editCategorySlugs, subcategorySlugs: editSubcategorySlugs, approved: true, confidence: 100 }
            : m
        )
      )
      cancelEdit()
    }
  }

  async function approveMapping(mappingId: string) {
    const res = await fetch('/api/admin/google-types', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: mappingId, approved: true, confidence: 100 }),
    })

    if (res.ok) {
      setMappings((prev) =>
        prev.map((m) => (m.id === mappingId ? { ...m, approved: true, confidence: 100 } : m))
      )
    }
  }

  function toggleCategory(slug: string) {
    setEditCategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  function toggleSubcategory(slug: string) {
    setEditSubcategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const pendingCount = mappings.filter((m) => !m.approved).length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-4">
        <div className="rounded-lg border border-border/50 bg-card px-4 py-2">
          <div className="text-2xl font-bold">{mappings.length}</div>
          <div className="text-xs text-muted-foreground">Total mappings</div>
        </div>
        <div className="rounded-lg border border-border/50 bg-card px-4 py-2">
          <div className="text-2xl font-bold text-green-500">{mappings.filter((m) => m.approved).length}</div>
          <div className="text-xs text-muted-foreground">Aprobados</div>
        </div>
        <div className="rounded-lg border border-border/50 bg-card px-4 py-2">
          <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
          <div className="text-xs text-muted-foreground">Pendientes</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar tipo de Google..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border/50 bg-card py-2 pl-10 pr-4 text-sm"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border/50 bg-card p-1">
          {(['all', 'approved', 'pending'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filterType === type ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {type === 'all' ? 'Todos' : type === 'approved' ? 'Aprobados' : 'Pendientes'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Google Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Categorías
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Subcategorías
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Confianza
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filtered.map((mapping) => {
              const isEditing = editingId === mapping.id
              return (
                <tr key={mapping.id} className={isEditing ? 'bg-accent/20' : 'hover:bg-muted/20'}>
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-2 py-0.5 text-sm">{mapping.googleType}</code>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex flex-wrap gap-1">
                        {venueCategories.map((cat) => (
                          <button
                            key={cat.slug}
                            onClick={() => toggleCategory(cat.slug)}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                              editCategorySlugs.includes(cat.slug)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {cat.icon} {cat.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {mapping.categorySlugs.map((slug) => {
                          const cat = categories.find((c) => c.slug === slug)
                          return (
                            <span key={slug} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              {cat?.icon} {cat?.name || slug}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                        {venueCategories.flatMap((cat) =>
                          cat.subcategories.map((sub) => (
                            <button
                              key={sub.slug}
                              onClick={() => toggleSubcategory(sub.slug)}
                              className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                                editSubcategorySlugs.includes(sub.slug)
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              {sub.name}
                            </button>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {mapping.subcategorySlugs.map((slug) => {
                          const sub = categories.flatMap((c) => c.subcategories).find((s) => s.slug === slug)
                          return (
                            <span key={slug} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600">
                              {sub?.name || slug}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        mapping.confidence >= 100
                          ? 'bg-green-500/10 text-green-600'
                          : mapping.confidence >= 80
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-red-500/10 text-red-600'
                      }`}
                    >
                      {mapping.confidence}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {mapping.approved ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-500">
                        <Check className="h-3 w-3" /> Aprobado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                        <Filter className="h-3 w-3" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => saveEdit(mapping.id)}
                          className="rounded-lg bg-green-500/10 p-1.5 text-green-500 hover:bg-green-500/20"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button onClick={cancelEdit} className="rounded-lg bg-red-500/10 p-1.5 text-red-500 hover:bg-red-500/20">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => startEdit(mapping)}
                          className="rounded-lg bg-muted p-1.5 text-muted-foreground hover:bg-muted/80"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {!mapping.approved && (
                          <button
                            onClick={() => approveMapping(mapping.id)}
                            className="rounded-lg bg-green-500/10 p-1.5 text-green-500 hover:bg-green-500/20"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No se encontraron mappings
        </div>
      )}
    </div>
  )
}
