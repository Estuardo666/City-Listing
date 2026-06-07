'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { sendMessageAction, markConversationAsReadAction, closeConversationAction, deleteMessageAction, reportMessageAction } from '@/actions/messaging/messages'
import { getQuickRepliesAction } from '@/actions/messaging/quick-replies'
import { Send, Paperclip, MoreVertical, Archive, ArchiveRestore, Trash2, Flag, Zap, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Message {
  id: string
  content: string | null
  images: string[]
  senderId: string
  receiverId: string
  isRead: boolean
  readAt: Date | null
  isDeleted: boolean
  createdAt: Date
}

interface QuickReply {
  id: string
  title: string
  content: string
}

interface MessageThreadProps {
  conversationId: string
  venueId: string
  otherUser: {
    id: string
    name: string | null
    image: string | null
  }
  messages: Message[]
  currentUserId: string
  isClosed: boolean
  onCloseConversation?: () => void
  onReopenConversation?: () => void
}

export function MessageThread({
  conversationId,
  venueId,
  otherUser,
  messages,
  currentUserId,
  isClosed,
  onCloseConversation,
  onReopenConversation,
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [reportConfirm, setReportConfirm] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadQuickReplies()
    markAsRead()
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadQuickReplies = async () => {
    const replies = await getQuickRepliesAction(venueId)
    setQuickReplies(replies)
  }

  const markAsRead = async () => {
    await markConversationAsReadAction(venueId, otherUser.id)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const result = await sendMessageAction(venueId, otherUser.id, newMessage.trim())
      if (result.success) {
        setNewMessage('')
        toast.success('Mensaje enviado.')
      } else {
        toast.error(result.error ?? 'Error al enviar.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setSending(false)
    }
  }

  const handleQuickReply = async (content: string) => {
    setNewMessage(content)
    setShowQuickReplies(false)
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const result = await deleteMessageAction(messageId)
      if (result.success) {
        toast.success('Mensaje eliminado.')
      } else {
        toast.error(result.error ?? 'Error al eliminar.')
      }
    } catch {
      toast.error('Error inesperado.')
    }
    setDeleteConfirm(null)
  }

  const handleReportMessage = async (messageId: string) => {
    try {
      const result = await reportMessageAction(messageId, 'SPAM')
      if (result.success) {
        toast.success('Mensaje reportado.')
      } else {
        toast.error(result.error ?? 'Error al reportar.')
      }
    } catch {
      toast.error('Error inesperado.')
    }
    setReportConfirm(null)
  }

  const handleCloseConversation = async () => {
    try {
      await closeConversationAction(venueId, otherUser.id)
      onCloseConversation?.()
      toast.success('Conversación cerrada.')
    } catch {
      toast.error('Error al cerrar conversación.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const groupedMessages = messages.reduce((groups, message) => {
    const dateKey = format(new Date(message.createdAt), 'yyyy-MM-dd')
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(message)
    return groups
  }, {} as Record<string, Message[]>)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.image ?? undefined} />
            <AvatarFallback>
              {otherUser.name?.charAt(0)?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{otherUser.name ?? 'Usuario'}</p>
            {isClosed && (
              <span className="text-xs text-muted-foreground">Conversación cerrada</span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isClosed ? (
              <DropdownMenuItem onClick={onReopenConversation}>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Reabrir conversación
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleCloseConversation}>
                <Archive className="h-4 w-4 mr-2" />
                Cerrar conversación
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
          <div key={dateKey}>
            <div className="flex items-center justify-center mb-4">
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {format(new Date(dateKey), "d 'de' MMMM", { locale: es })}
              </span>
            </div>
            <div className="space-y-3">
              {msgs.map((message) => {
                const isOwn = message.senderId === currentUserId
                const isOther = message.senderId === otherUser.id

                if (message.isDeleted) {
                  return (
                    <div key={message.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                      <div className="max-w-[70%] px-4 py-2 rounded-2xl bg-muted/50 text-muted-foreground text-sm italic">
                        Mensaje eliminado
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={message.id}
                    className={cn('flex group', isOwn ? 'justify-end' : 'justify-start')}
                  >
                    <div className={cn('max-w-[70%] space-y-1', isOwn && 'items-end')}>
                      <div
                        className={cn(
                          'px-4 py-2 rounded-2xl',
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted rounded-bl-sm'
                        )}
                      >
                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                        {message.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-1 mt-2">
                            {message.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Imagen ${idx + 1}`}
                                className="rounded-lg max-h-40 object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={cn('flex items-center gap-2 px-2', isOwn ? 'justify-end' : 'justify-start')}>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), 'HH:mm')}
                        </span>
                        {isOwn && (
                          <span>
                            {message.isRead ? (
                              <span className="text-blue-500 text-xs">✓✓</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">✓</span>
                            )}
                          </span>
                        )}
                      </div>
                      {/* Actions on hover */}
                      <div className={cn(
                        'hidden group-hover:flex gap-1',
                        isOwn ? 'justify-end' : 'justify-start'
                      )}>
                        {isOwn && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => setDeleteConfirm(message.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                        {isOther && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => setReportConfirm(message.id)}
                          >
                            <Flag className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {showQuickReplies && quickReplies.length > 0 && (
        <div className="border-t p-3 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Respuestas rápidas</span>
            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setShowQuickReplies(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <Button
                key={reply.id}
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => handleQuickReply(reply.content)}
              >
                {reply.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      {!isClosed && (
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe un mensaje..."
                className="min-h-[44px] max-h-[120px] resize-none pr-10"
                rows={1}
                disabled={sending}
              />
              {quickReplies.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-2 h-7 w-7 p-0"
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                >
                  <Zap className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Presiona Enter para enviar, Shift+Enter para nueva línea
          </p>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Este mensaje será eliminado para todos los participantes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDeleteMessage(deleteConfirm)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Confirmation */}
      <AlertDialog open={!!reportConfirm} onOpenChange={() => setReportConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reportar mensaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Este mensaje será reportado como spam o contenido inapropiado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => reportConfirm && handleReportMessage(reportConfirm)}>
              Reportar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
