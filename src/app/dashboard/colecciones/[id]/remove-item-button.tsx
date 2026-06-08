'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { removeFromCollectionAction } from '@/actions/collections'
import { X } from 'lucide-react'

interface RemoveItemButtonProps {
  itemId: string
}

export function RemoveItemButton({ itemId }: RemoveItemButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleRemove() {
    startTransition(async () => {
      const result = await removeFromCollectionAction(itemId)
      if (result.success) {
        toast.success('Eliminado de la colección.')
      } else {
        toast.error(result.error ?? 'Error.')
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      onClick={handleRemove}
      disabled={isPending}
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  )
}
