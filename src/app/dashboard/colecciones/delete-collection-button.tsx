'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteCollectionAction } from '@/actions/collections'

export function DeleteCollectionButton({ collectionId }: { collectionId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Eliminar esta colección?')) return
    setLoading(true)
    try {
      const result = await deleteCollectionAction(collectionId)
      if (result.success) {
        toast.success('Colección eliminada.')
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

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
    </Button>
  )
}
