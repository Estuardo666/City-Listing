'use client'

import { useMemo, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CornerDownRight, MessageCircle, Send, Trash2, User2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createCommentAction, deleteCommentAction } from '@/actions/comments'
import type { CommentWithUser } from '@/actions/comments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const schema = z.object({
  content: z.string().min(1, 'Escribe algo').max(1000, 'Máximo 1000 caracteres'),
})
type FormInput = z.infer<typeof schema>

type CommentSectionProps = {
  initialComments: CommentWithUser[]
  eventId?: string
  venueId?: string
  postId?: string
}

function timeAgo(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

export function CommentSection({ initialComments, eventId, venueId, postId }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormInput>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormInput) => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión para comentar')
      return
    }

    startTransition(async () => {
      const result = await createCommentAction({ content: data.content, eventId, venueId, postId })
      if (result.success && result.data) {
        setComments((prev) => [result.data!, ...prev])
        reset()
        toast.success('Comentario publicado')
      } else {
        toast.error(result.error ?? 'Error al publicar')
      }
    })
  }

  const onReplySubmit = (parentId: string, content: string) => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión para responder')
      return
    }

    startTransition(async () => {
      const result = await createCommentAction({ content, eventId, venueId, postId, parentId })
      if (result.success && result.data) {
        setComments((prev) => [result.data!, ...prev])
        setReplyingTo(null)
        toast.success('Respuesta publicada')
      } else {
        toast.error(result.error ?? 'Error al responder')
      }
    })
  }

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      const result = await deleteCommentAction(commentId)
      if (result.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
        toast.success('Comentario eliminado')
      } else {
        toast.error(result.error ?? 'Error al eliminar')
      }
    })
  }

  const commentsByParent = useMemo(() => {
    const grouped = new Map<string | null, CommentWithUser[]>()
    for (const comment of comments) {
      const key = comment.parentId ?? null
      const list = grouped.get(key) ?? []
      list.push(comment)
      grouped.set(key, list)
    }
    for (const [key, list] of grouped.entries()) {
      grouped.set(
        key,
        [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      )
    }
    return grouped
  }, [comments])

  const rootComments = commentsByParent.get(null) ?? []

  function ReplyForm({ parentId }: { parentId: string }) {
    const replySchema = z.object({
      content: z.string().min(1, 'Escribe algo').max(1000, 'Máximo 1000 caracteres'),
    })
    type ReplyInput = z.infer<typeof replySchema>

    const {
      register: registerReply,
      handleSubmit: handleReplySubmit,
      reset: resetReply,
      formState: { errors: replyErrors },
    } = useForm<ReplyInput>({
      resolver: zodResolver(replySchema),
    })

    return (
      <form
        onSubmit={handleReplySubmit((data) => {
          onReplySubmit(parentId, data.content)
          resetReply()
        })}
        className="mt-3 space-y-2"
      >
        <Textarea
          {...registerReply('content')}
          placeholder="Escribe una respuesta..."
          rows={2}
          className="resize-none text-sm"
        />
        {replyErrors.content && (
          <p className="text-xs text-destructive">{replyErrors.content.message}</p>
        )}
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            className="h-8 border border-border/80 bg-background text-foreground hover:bg-accent"
            onClick={() => setReplyingTo(null)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} size="sm" className="h-8 gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Responder
          </Button>
        </div>
      </form>
    )
  }

  function CommentNode({ comment, depth = 0 }: { comment: CommentWithUser; depth?: number }) {
    const children = commentsByParent.get(comment.id) ?? []
    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginTop: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn('flex gap-3', depth > 0 && 'ml-4 sm:ml-8')}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.user.image ?? ''} />
          <AvatarFallback className="text-xs">
            {comment.user.name?.charAt(0).toUpperCase() ?? <User2 className="h-3.5 w-3.5" />}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {depth > 0 && <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="text-sm font-semibold text-foreground">{comment.user.name ?? 'Usuario'}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
              </div>

              <div className="flex items-center gap-2">
                {session?.user && (
                  <button
                    onClick={() => setReplyingTo((prev) => (prev === comment.id ? null : comment.id))}
                    className="text-xs text-primary/80 transition-colors hover:text-primary"
                  >
                    Responder
                  </button>
                )}

                {(session?.user?.id === comment.user.id || session?.user?.role === 'ADMIN') && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-muted-foreground/50 transition-colors hover:text-destructive"
                    aria-label="Eliminar comentario"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p className="mt-1 text-sm text-foreground/80">{comment.content}</p>

            {replyingTo === comment.id ? <ReplyForm parentId={comment.id} /> : null}
          </div>

          {children.length > 0 ? (
            <div className="mt-3 space-y-3">
              {children.map((child) => (
                <CommentNode key={child.id} comment={child} depth={depth + 1} />
              ))}
            </div>
          ) : null}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-base font-semibold text-foreground">
          Comentarios <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
        </h3>
      </div>

      {/* Form */}
      {session?.user ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={session.user.image ?? ''} />
            <AvatarFallback className="text-xs">{session.user.name?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              {...register('content')}
              placeholder="Escribe un comentario..."
              rows={2}
              className="resize-none text-sm"
            />
            {errors.content && (
              <p className="text-xs text-destructive">{errors.content.message}</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} size="sm" className="h-8 gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Publicar
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 px-4 py-3 text-center text-sm text-muted-foreground">
          <a href="/auth/signin" className="text-primary hover:underline">Inicia sesión</a> para comentar
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {rootComments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sé el primero en comentar.</p>
          ) : (
            rootComments.map((comment) => <CommentNode key={comment.id} comment={comment} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
