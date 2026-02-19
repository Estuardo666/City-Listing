'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toggleFavoriteAction } from '@/actions/favorites'
import { cn } from '@/lib/utils'

type FavoriteButtonProps = {
  eventId?: string
  venueId?: string
  postId?: string
  initialIsFavorite: boolean
  size?: 'sm' | 'md'
}

export function FavoriteButton({
  eventId,
  venueId,
  postId,
  initialIsFavorite,
  size = 'md',
}: FavoriteButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPending, startTransition] = useTransition()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    const optimistic = !isFavorite
    setIsFavorite(optimistic)

    startTransition(async () => {
      const result = await toggleFavoriteAction({ eventId, venueId, postId })
      if (!result.success) {
        setIsFavorite(!optimistic)
        toast.error(result.error ?? 'Error al actualizar favorito')
      } else {
        toast.success(result.data?.isFavorite ? 'Guardado en favoritos' : 'Eliminado de favoritos')
      }
    })
  }

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const btnSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'

  return (
    <motion.button
      onClick={handleClick}
      disabled={isPending}
      whileTap={{ scale: 0.82 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full border transition-colors',
        btnSize,
        isFavorite
          ? 'border-rose-300 bg-rose-50 text-rose-500 hover:bg-rose-100'
          : 'border-border/60 bg-background/80 text-muted-foreground hover:border-rose-300 hover:text-rose-400',
        isPending && 'pointer-events-none opacity-70'
      )}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isFavorite ? 'filled' : 'empty'}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart
            className={cn(iconSize, isFavorite && 'fill-rose-500')}
            strokeWidth={isFavorite ? 0 : 1.8}
          />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
