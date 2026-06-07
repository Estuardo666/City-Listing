'use client'

import { StarRatingDisplay } from '@/components/review/star-rating'
import { UserLevelBadge } from '@/components/user/user-level-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Trash2, Camera } from 'lucide-react'
import { deleteReviewAction } from '@/actions/reviews'
import { OwnerReply } from '@/components/review/owner-reply'
import { toast } from 'sonner'
import { useState } from 'react'

interface ReviewPhoto {
  id: string
  url: string
  order: number
}

interface ReviewItem {
  id: string
  rating: number
  title: string | null
  content: string | null
  ownerReply: string | null
  ownerReplyAt: Date | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    image: string | null
    reputationScore?: number
    reviewerLevel?: number
  }
  photos?: ReviewPhoto[]
}

interface ReviewListProps {
  reviews: ReviewItem[]
  currentUserId?: string
  entityOwnerId?: string
  onDelete?: () => void
}

export function ReviewList({ reviews, currentUserId, entityOwnerId, onDelete }: ReviewListProps) {
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
            <AvatarFallback>{review.user.name?.charAt(0)?.toUpperCase() ?? '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{review.user.name ?? 'Anónimo'}</span>
                {review.user.reputationScore !== undefined && review.user.reviewerLevel !== undefined && review.user.reputationScore > 0 && (
                  <UserLevelBadge
                    reputationScore={review.user.reputationScore}
                    reviewerLevel={review.user.reviewerLevel}
                    size="sm"
                    showName={false}
                  />
                )}
                <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
              </div>
              {currentUserId === review.user.id && (
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDelete(review.id)} disabled={deletingId === review.id}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
            <StarRatingDisplay rating={review.rating} showCount={false} size="sm" />
            {review.title && <p className="text-sm font-medium mt-1">{review.title}</p>}
            {review.content && <p className="text-sm text-muted-foreground mt-1">{review.content}</p>}
            {review.photos && review.photos.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {review.photos.sort((a, b) => a.order - b.order).map((photo) => (
                  <img key={photo.id} src={photo.url} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                ))}
              </div>
            )}
            <OwnerReply
              reviewId={review.id}
              ownerReply={review.ownerReply}
              ownerReplyAt={review.ownerReplyAt}
              isOwner={currentUserId === entityOwnerId}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
