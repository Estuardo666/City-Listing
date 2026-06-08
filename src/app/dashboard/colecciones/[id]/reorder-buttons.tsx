'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { reorderCollectionItemsAction } from '@/actions/collections'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface ReorderButtonsProps {
  collectionId: string
  itemId: string
  items: { id: string; order: number }[]
  direction: 'up' | 'down'
}

export function ReorderButtons({ collectionId, itemId, items, direction }: ReorderButtonsProps) {
  const [isPending, startTransition] = useTransition()

  function handleReorder() {
    const currentIndex = items.findIndex((i) => i.id === itemId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const newItems = [...items]
    const temp = newItems[currentIndex]
    newItems[currentIndex] = newItems[newIndex]
    newItems[newIndex] = temp

    const reordered = newItems.map((item, index) => ({ id: item.id, order: index }))

    startTransition(async () => {
      const result = await reorderCollectionItemsAction(collectionId, reordered)
      if (!result.success) {
        toast.error(result.error ?? 'Error.')
      }
    })
  }

  const Icon = direction === 'up' ? ChevronUp : ChevronDown

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={handleReorder}
      disabled={isPending}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  )
}
