'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { updateCollectionAction } from '@/actions/collections'
import { Pencil, X } from 'lucide-react'

interface CollectionEditFormProps {
  collection: {
    id: string
    name: string
    description: string | null
    icon: string | null
    isPublic: boolean
  }
}

const ICON_OPTIONS = ['📁', '☕', '🍽️', '🍸', '🎵', '🌿', '🛍️', '📸', '🏔️', '🎭', '💡', '❤️']

export function CollectionEditForm({ collection }: CollectionEditFormProps) {
  const [show, setShow] = useState(false)
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description ?? '')
  const [icon, setIcon] = useState(collection.icon ?? '📁')
  const [isPublic, setIsPublic] = useState(collection.isPublic)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setLoading(true)
    try {
      const result = await updateCollectionAction(collection.id, {
        name: name.trim(),
        description: description.trim() || null,
        icon,
        isPublic,
      })
      if (result.success) {
        toast.success('Colección actualizada.')
        setShow(false)
      } else {
        toast.error(result.error ?? 'Error.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  if (!show) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShow(true)} className="gap-1.5">
        <Pencil className="h-3.5 w-3.5" /> Editar
      </Button>
    )
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Editar colección</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShow(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Icono</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {ICON_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                  icon === emoji ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted hover:bg-accent'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="mt-1 text-sm" />
        </div>

        <div>
          <Label className="text-xs">Descripción</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} rows={2} className="mt-1 text-sm resize-none" />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              isPublic ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
          <Label className="text-xs">{isPublic ? 'Público' : 'Privado'}</Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={loading || !name.trim()}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShow(false)}>Cancelar</Button>
      </div>
    </div>
  )
}
