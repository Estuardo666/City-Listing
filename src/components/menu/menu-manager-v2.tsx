'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  createMenuCategoryAction, deleteMenuCategoryAction, updateMenuCategoryAction,
  createMenuItemAction, deleteMenuItemAction, updateMenuItemAction,
  toggleItemAvailabilityAction, toggleItemFeaturedAction,
} from '@/actions/menu/manage-menu'
import { Plus, Trash2, ChevronDown, ChevronUp, Edit, Star, GripVertical } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number | null
  image: string | null
  order: number
  isAvailable: boolean
  isFeatured: boolean
}

interface MenuCategory {
  id: string
  name: string
  order: number
  items: MenuItem[]
}

interface MenuManagerV2Props {
  venueId: string
  initialMenu: MenuCategory[]
}

export function MenuManagerV2({ venueId, initialMenu }: MenuManagerV2Props) {
  const [categories, setCategories] = useState(initialMenu)
  const [showCatForm, setShowCatForm] = useState(false)
  const [catName, setCatName] = useState('')
  const [showItemForm, setShowItemForm] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', image: '' })
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editItemForm, setEditItemForm] = useState({ name: '', description: '', price: '', image: '' })
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')
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
      } else { toast.error(result.error ?? 'Error.') }
    } catch { toast.error('Error inesperado.') }
    finally { setLoading(false) }
  }

  async function handleDeleteCategory(catId: string) {
    if (!confirm('¿Eliminar categoría y todos sus productos?')) return
    setLoading(true)
    try {
      const result = await deleteMenuCategoryAction(catId)
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== catId))
        toast.success('Eliminada.')
      } else { toast.error(result.error ?? 'Error.') }
    } catch { toast.error('Error inesperado.') }
    finally { setLoading(false) }
  }

  async function handleUpdateCategory(catId: string) {
    if (!editCatName.trim()) return
    setLoading(true)
    try {
      const result = await updateMenuCategoryAction(catId, editCatName.trim())
      if (result.success && result.data) {
        setCategories((prev) => prev.map((c) => c.id === catId ? { ...c, name: result.data!.name } : c))
        setEditingCat(null)
        toast.success('Actualizada.')
      } else { toast.error(result.error ?? 'Error.') }
    } catch { toast.error('Error inesperado.') }
    finally { setLoading(false) }
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
          prev.map((c) => c.id === catId ? { ...c, items: [...c.items, result.data as MenuItem] } : c)
        )
        setItemForm({ name: '', description: '', price: '', image: '' })
        setShowItemForm(null)
        toast.success('Producto agregado.')
      } else { toast.error(result.error ?? 'Error.') }
    } catch { toast.error('Error inesperado.') }
    finally { setLoading(false) }
  }

  async function handleDeleteItem(itemId: string, catId: string) {
    setLoading(true)
    try {
      const result = await deleteMenuItemAction(itemId)
      if (result.success) {
        setCategories((prev) =>
          prev.map((c) => c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c)
        )
        toast.success('Eliminado.')
      } else { toast.error(result.error ?? 'Error.') }
    } catch { toast.error('Error inesperado.') }
    finally { setLoading(false) }
  }

  async function handleToggleAvailability(itemId: string, catId: string) {
    const result = await toggleItemAvailabilityAction(itemId)
    if (result.success && result.data) {
      setCategories((prev) =>
        prev.map((c) => c.id === catId ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i) } : c)
      )
    } else { toast.error(result.error ?? 'Error.') }
  }

  async function handleToggleFeatured(itemId: string, catId: string) {
    const result = await toggleItemFeaturedAction(itemId)
    if (result.success && result.data) {
      setCategories((prev) =>
        prev.map((c) => c.id === catId ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, isFeatured: !i.isFeatured } : i) } : c)
      )
      toast.success('Estado actualizado.')
    } else { toast.error(result.error ?? 'Error.') }
  }

  async function handleUpdateItem(itemId: string, catId: string) {
    if (!editItemForm.name.trim()) return
    setLoading(true)
    try {
      const result = await updateMenuItemAction(itemId, editItemForm)
      if (result.success && result.data) {
        setCategories((prev) =>
          prev.map((c) => c.id === catId ? { ...c, items: c.items.map((i) => i.id === itemId ? result.data as MenuItem : i) } : c)
        )
        setEditingItem(null)
        toast.success('Actualizado.')
      } else { toast.error(result.error ?? 'Error.') }
    } catch { toast.error('Error inesperado.') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => toggleExpand(cat.id)} className="flex items-center gap-2 flex-1">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              {expandedCats.has(cat.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {editingCat === cat.id ? (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    className="h-7 text-sm w-48"
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleUpdateCategory(cat.id)} disabled={loading}>
                    <Edit className="h-3.5 w-3.5 text-emerald-600" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingCat(null)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="font-semibold">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">({cat.items.length})</span>
                </>
              )}
            </button>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setShowItemForm(showItemForm === cat.id ? null : cat.id)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingCat(cat.id); setEditCatName(cat.name) }}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(cat.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          {showItemForm === cat.id && (
            <div className="px-4 pb-4 space-y-2 border-t pt-3">
              <Input placeholder="Nombre del producto" value={itemForm.name} onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))} className="text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Descripción (opcional)" value={itemForm.description} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} className="text-sm" />
                <Input placeholder="Precio (opcional)" type="number" step="0.01" value={itemForm.price} onChange={(e) => setItemForm((p) => ({ ...p, price: e.target.value }))} className="text-sm" />
              </div>
              <Input placeholder="URL de imagen (opcional)" value={itemForm.image} onChange={(e) => setItemForm((p) => ({ ...p, image: e.target.value }))} className="text-sm" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAddItem(cat.id)} disabled={loading}>{loading ? '...' : 'Agregar'}</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowItemForm(null); setItemForm({ name: '', description: '', price: '', image: '' }) }}>Cancelar</Button>
              </div>
            </div>
          )}

          {expandedCats.has(cat.id) && cat.items.length > 0 && (
            <div className="border-t divide-y">
              {cat.items.map((item) => (
                <div key={item.id} className={`px-4 py-3 ${!item.isAvailable ? 'opacity-50' : ''}`}>
                  {editingItem === item.id ? (
                    <div className="space-y-2">
                      <Input placeholder="Nombre" value={editItemForm.name} onChange={(e) => setEditItemForm((p) => ({ ...p, name: e.target.value }))} className="text-sm" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Descripción" value={editItemForm.description} onChange={(e) => setEditItemForm((p) => ({ ...p, description: e.target.value }))} className="text-sm" />
                        <Input placeholder="Precio" type="number" step="0.01" value={editItemForm.price} onChange={(e) => setEditItemForm((p) => ({ ...p, price: e.target.value }))} className="text-sm" />
                      </div>
                      <Input placeholder="URL de imagen" value={editItemForm.image} onChange={(e) => setEditItemForm((p) => ({ ...p, image: e.target.value }))} className="text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateItem(item.id, cat.id)} disabled={loading}>Guardar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            {item.isFeatured && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
                          </div>
                          {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {item.price !== null && <span className="text-sm font-semibold">${item.price.toFixed(2)}</span>}
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={() => handleToggleAvailability(item.id, cat.id)}
                          disabled={loading}
                        />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleToggleFeatured(item.id, cat.id)}>
                          <Star className={`h-3.5 w-3.5 ${item.isFeatured ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => { setEditingItem(item.id); setEditItemForm({ name: item.name, description: item.description ?? '', price: item.price?.toString() ?? '', image: item.image ?? '' }) }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDeleteItem(item.id, cat.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  )}
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
