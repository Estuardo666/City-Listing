'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createMenuCategoryAction, deleteMenuCategoryAction, createMenuItemAction, deleteMenuItemAction } from '@/actions/menu'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number | null
  image: string | null
  isAvailable: boolean
  order: number
}

interface MenuCategory {
  id: string
  name: string
  order: number
  items: MenuItem[]
}

interface MenuManagerProps {
  venueId: string
  initialMenu: MenuCategory[]
}

export function MenuManager({ venueId, initialMenu }: MenuManagerProps) {
  const [categories, setCategories] = useState(initialMenu)
  const [showCatForm, setShowCatForm] = useState(false)
  const [catName, setCatName] = useState('')
  const [showItemForm, setShowItemForm] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', image: '' })
  const [loading, setLoading] = useState(false)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(initialMenu.map((c) => c.id)))

  function toggleExpand(catId: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  async function handleAddCategory() {
    if (!catName.trim()) return
    setLoading(true)
    try {
      const result = await createMenuCategoryAction(venueId, { name: catName.trim() })
      if (result.success && result.data) {
        setCategories((prev) => [...prev, { ...result.data!, items: [] }])
        setCatName('')
        setShowCatForm(false)
        toast.success('Categoría creada.')
      } else {
        toast.error(result.error ?? 'Error.')
      }
    } catch { toast.error('Error inesperado.') }
    finally { setLoading(false) }
  }

  async function handleDeleteCategory(catId: string) {
    if (!confirm('¿Eliminar categoría y todos sus items?')) return
    try {
      const result = await deleteMenuCategoryAction(catId)
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== catId))
        toast.success('Eliminada.')
      } else { toast.error(result.error ?? 'Error.') }
    } catch { toast.error('Error inesperado.') }
  }

  async function handleAddItem(catId: string) {
    if (!itemForm.name.trim()) return
    setLoading(true)
    try {
      const result = await createMenuItemAction(catId, {
        name: itemForm.name.trim(),
        description: itemForm.description || null,
        price: itemForm.price || null,
        image: itemForm.image || null,
      })
      if (result.success && result.data) {
        setCategories((prev) =>
          prev.map((c) => c.id === catId ? { ...c, items: [...c.items, result.data!] } : c)
        )
        setItemForm({ name: '', description: '', price: '', image: '' })
        setShowItemForm(null)
        toast.success('Item agregado.')
      } else { toast.error(result.error ?? 'Error.') }
    } catch { toast.error('Error inesperado.') }
    finally { setLoading(false) }
  }

  async function handleDeleteItem(itemId: string, catId: string) {
    try {
      const result = await deleteMenuItemAction(itemId)
      if (result.success) {
        setCategories((prev) =>
          prev.map((c) => c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c)
        )
        toast.success('Eliminado.')
      } else { toast.error(result.error ?? 'Error.') }
    } catch { toast.error('Error inesperado.') }
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => toggleExpand(cat.id)} className="flex items-center gap-2 flex-1">
              {expandedCats.has(cat.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="font-semibold">{cat.name}</span>
              <span className="text-xs text-muted-foreground">({cat.items.length})</span>
            </button>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setShowItemForm(showItemForm === cat.id ? null : cat.id)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(cat.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          {showItemForm === cat.id && (
            <div className="px-4 pb-4 space-y-2 border-t pt-3">
              <Input placeholder="Nombre del item" value={itemForm.name} onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))} className="text-sm" />
              <Input placeholder="Descripción (opcional)" value={itemForm.description} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} className="text-sm" />
              <Input placeholder="Precio (opcional)" type="number" value={itemForm.price} onChange={(e) => setItemForm((p) => ({ ...p, price: e.target.value }))} className="text-sm" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAddItem(cat.id)} disabled={loading}>{loading ? '...' : 'Agregar'}</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowItemForm(null)}>Cancelar</Button>
              </div>
            </div>
          )}

          {expandedCats.has(cat.id) && cat.items.length > 0 && (
            <div className="border-t divide-y">
              {cat.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {item.price !== null && <span className="text-sm font-semibold">${item.price.toFixed(2)}</span>}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteItem(item.id, cat.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {showCatForm ? (
        <div className="flex gap-2">
          <Input placeholder="Nombre de la categoría..." value={catName} onChange={(e) => setCatName(e.target.value)} maxLength={60} className="text-sm" />
          <Button onClick={handleAddCategory} disabled={loading}>{loading ? '...' : 'Crear'}</Button>
          <Button variant="ghost" onClick={() => { setShowCatForm(false); setCatName('') }}>Cancelar</Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowCatForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Agregar categoría
        </Button>
      )}
    </div>
  )
}
