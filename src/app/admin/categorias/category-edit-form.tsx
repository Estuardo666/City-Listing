'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { updateCategoryAction } from '@/actions/categories/update-category'

type CategoryData = {
  id: string
  name: string
  slug: string
  description: string | null
  seoTitle: string | null
  seoDescription: string | null
  introText: string | null
  icon: string | null
  color: string | null
  venueCount: number
}

type CategoryEditFormProps = {
  category: CategoryData
}

export function CategoryEditForm({ category }: CategoryEditFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    description: category.description ?? '',
    seoTitle: category.seoTitle ?? '',
    seoDescription: category.seoDescription ?? '',
    introText: category.introText ?? '',
    icon: category.icon ?? '',
    color: category.color ?? '#000000',
  })

  const autoTitle = `${category.name} en Loja | ViveLoja`
  const autoDescription = `Descubre los mejores ${category.name.toLowerCase()} en Loja. Explora horarios, resenas, promociones, ubicacion y mas en ViveLoja.`
  const autoIntro = `Explora los mejores ${category.name.toLowerCase()} recomendados por la comunidad lojana. Encuentra horarios, resenas, ubicaciones y promociones.`

  async function handleSave() {
    setLoading(true)
    try {
      const result = await updateCategoryAction({
        categoryId: category.id,
        description: form.description || null,
        seoTitle: form.seoTitle || null,
        seoDescription: form.seoDescription || null,
        introText: form.introText || null,
        icon: form.icon || null,
        color: form.color || null,
      })

      if (result.success) {
        toast.success('Categoria actualizada correctamente')
      } else {
        toast.error(result.error ?? 'Error al actualizar')
      }
    } catch {
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: form.color + '20', color: form.color }}
          >
            {form.icon || category.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{category.name}</h3>
            <p className="text-xs text-muted-foreground">
              /{category.slug} · {category.venueCount} locales
            </p>
          </div>
        </div>
      </div>

      {/* Campos editables */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Icono (emoji)
          </label>
          <input
            type="text"
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            placeholder={category.icon ?? 'Ej: 🍴'}
            className="h-9 w-full rounded-lg border border-border/60 bg-secondary/40 px-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="h-9 w-12 rounded-lg border border-border/60 bg-secondary/40 cursor-pointer"
            />
            <input
              type="text"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="h-9 flex-1 rounded-lg border border-border/60 bg-secondary/40 px-3 text-sm font-mono focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Descripcion
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Descripcion general de la categoria..."
          rows={2}
          className="w-full rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {/* SEO Fields */}
      <div className="border-t border-border/50 pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Campos SEO</h4>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Titulo SEO
            </label>
            <span className="text-[10px] text-muted-foreground/60">
              Auto: {autoTitle}
            </span>
          </div>
          <input
            type="text"
            value={form.seoTitle}
            onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
            placeholder={autoTitle}
            maxLength={70}
            className="h-9 w-full rounded-lg border border-border/60 bg-secondary/40 px-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          <p className="text-[10px] text-muted-foreground/50">
            {form.seoTitle.length}/70 caracteres
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Descripcion SEO
            </label>
            <span className="text-[10px] text-muted-foreground/60">
              Auto: {autoDescription.substring(0, 50)}...
            </span>
          </div>
          <textarea
            value={form.seoDescription}
            onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
            placeholder={autoDescription}
            maxLength={160}
            rows={2}
            className="w-full rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          <p className="text-[10px] text-muted-foreground/50">
            {form.seoDescription.length}/160 caracteres
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Texto introductorio
            </label>
            <span className="text-[10px] text-muted-foreground/60">
              Auto: {autoIntro.substring(0, 40)}...
            </span>
          </div>
          <textarea
            value={form.introText}
            onChange={(e) => setForm((f) => ({ ...f, introText: e.target.value }))}
            placeholder={autoIntro}
            maxLength={500}
            rows={3}
            className="w-full rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          <p className="text-[10px] text-muted-foreground/50">
            {form.introText.length}/500 caracteres
          </p>
        </div>
      </div>

      {/* Preview URLs */}
      <div className="border-t border-border/50 pt-4 space-y-2">
        <h4 className="text-sm font-semibold text-foreground">URLs generadas</h4>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <a
            href={`/${category.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            viveloja.com/{category.slug}
          </a>
          <a
            href={`/mejores/${category.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            viveloja.com/mejores/{category.slug}
          </a>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar cambios
        </button>
      </div>
    </div>
  )
}
