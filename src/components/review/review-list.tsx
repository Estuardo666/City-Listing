'use client'

import { StarRatingDisplay } from '@/components/review/star-rating'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { deleteReviewAction } from '@/actions/reviews'
import { toast } from 'sonner'
import { useState } from 'react'

interface ReviewItem {
  id: string
  rating: number
  title: string | null
  content: string | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

interface ReviewListProps {
  reviews: ReviewItem[]
  currentUserId?: string
  onDelete?: () => void
}

export function ReviewList({ reviews, currentUserId, onDelete }: ReviewListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(reviewId: string) {
    setDeletingId(reviewId)
    try {
      const result = await deleteReviewAction(reviewId)
      if (result.success) {
        toast.success('Reseña eliminada.')
        onDelete?.()
      } else {
        toast.error(result.error ?? 'Error al eliminar.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setDeletingId(null)
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No hay reseñas aún. Sé el primero en dejar una reseña.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="flex gap-3 p-4 rounded-lg border bg-card">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={review.user.image ?? undefined} />
            <AvatarFallback>
              {review.user.name?.charAt(0)?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-sm font-medium">{review.user.name ?? 'Anónimo'}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              {currentUserId === review.user.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
            <StarRatingDisplay rating={review.rating} showCount={false} size="sm" />
            {review.title && (
              <p className="text-sm font-medium mt-1">{review.title}</p>
            )}
            {review.content && (
              <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
