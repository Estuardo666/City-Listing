'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createCollectionAction } from '@/actions/collections'
import { Plus } from 'lucide-react'

export function CollectionCreateForm() {
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    try {
      const result = await createCollectionAction({ name: name.trim() })
      if (result.success) {
        toast.success('Colección creada.')
        setName('')
        setShow(false)
        window.location.reload()
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
      <Button onClick={() => setShow(true)} className="gap-2">
        <Plus className="h-4 w-4" /> Nueva colección
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Nombre de la colección..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        className="text-sm w-48"
        autoFocus
      />
      <Button onClick={handleCreate} disabled={loading || !name.trim()}>
        {loading ? '...' : 'Crear'}
      </Button>
      <Button variant="ghost" onClick={() => { setShow(false); setName('') }}>Cancelar</Button>
    </div>
  )
}
