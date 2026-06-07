'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createCollectionAction, addToCollectionAction, removeFromCollectionAction } from '@/actions/collections'
import { MapPin, Heart, Plus, X } from 'lucide-react'

interface Collection {
  id: string
  name: string
  icon: string | null
  _count: { items: number }
}

interface AddToCollectionButtonProps {
  collections: Collection[]
  entityId: string
  entityType: 'venueId' | 'eventId' | 'postId' | 'routeId'
  onSuccess?: () => void
}

export function AddToCollectionButton({ collections, entityId, entityType, onSuccess }: AddToCollectionButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAddToExisting(collectionId: string) {
    setLoading(true)
    try {
      const data: Record<string, string> = { collectionId, [entityType]: entityId }
      const result = await addToCollectionAction(data)
      if (result.success) {
        toast.success('Agregado a la colección.')
        setShowMenu(false)
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Error.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAndAdd() {
    if (!newName.trim()) return
    setLoading(true)
    try {
      const colResult = await createCollectionAction({ name: newName.trim() })
      if (colResult.success && colResult.data) {
        const data: Record<string, string> = { collectionId: colResult.data.id, [entityType]: entityId }
        const addResult = await addToCollectionAction(data)
        if (addResult.success) {
          toast.success('Colección creada y elemento agregado.')
          setShowMenu(false)
          setShowNewForm(false)
          setNewName('')
          onSuccess?.()
        }
      } else {
        toast.error(colResult.error ?? 'Error.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setShowMenu(!showMenu)} className="gap-1.5">
        <Heart className="h-3.5 w-3.5" /> Guardar
      </Button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xl border bg-card p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Guardar en colección</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowMenu(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>

          {collections.length > 0 && (
            <div className="space-y-1 mb-2">
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => handleAddToExisting(col.id)}
                  disabled={loading}
                  className="flex items-center gap-2 w-full p-2 rounded-lg text-sm hover:bg-accent transition-colors"
                >
                  <span>{col.icon ?? '📁'}</span>
                  <span className="flex-1 text-left truncate">{col.name}</span>
                  <span className="text-[10px] text-muted-foreground">{col._count.items}</span>
                </button>
              ))}
            </div>
          )}

          {showNewForm ? (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs">Nueva colección</Label>
              <Input
                placeholder="Nombre..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={60}
                className="text-sm"
              />
              <Button size="sm" onClick={handleCreateAndAdd} disabled={loading || !newName.trim()} className="w-full">
                {loading ? 'Creando...' : 'Crear y guardar'}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowNewForm(true)} className="w-full gap-1.5">
              <Plus className="h-3 w-3" /> Nueva colección
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
