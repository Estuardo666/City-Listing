'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Clock, Check, CheckCheck, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Conversation {
  id: string
  otherUser: {
    id: string
    name: string | null
    image: string | null
  }
  lastMessage: {
    content: string | null
    createdAt: Date
    isRead: boolean
    senderId: string
  } | null
  unreadCount: number
  isClosed: boolean
}

interface InboxProps {
  conversations: Conversation[]
  currentUserId: string
  selectedConversationId?: string
  onSelectConversation: (conversationId: string) => void
}

export function Inbox({ conversations, currentUserId, selectedConversationId, onSelectConversation }: InboxProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'closed'>('all')

  const filteredConversations = conversations.filter((conv) => {
    if (filter === 'unread') return conv.unreadCount > 0
    if (filter === 'closed') return conv.isClosed
    return true
  })

  const unreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensajes
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
        </div>
        {/* Filters */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            Todos
          </Button>
          <Button
            size="sm"
            variant={filter === 'unread' ? 'default' : 'ghost'}
            onClick={() => setFilter('unread')}
            className="text-xs"
          >
            No leídos
          </Button>
          <Button
            size="sm"
            variant={filter === 'closed' ? 'default' : 'ghost'}
            onClick={() => setFilter('closed')}
            className="text-xs"
          >
            <Archive className="h-3 w-3 mr-1" />
            Cerrados
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  'w-full p-4 text-left hover:bg-accent/50 transition-colors',
                  selectedConversationId === conversation.id && 'bg-accent',
                  conversation.unreadCount > 0 && 'bg-accent/30'
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={conversation.otherUser.image ?? undefined} />
                    <AvatarFallback>
                      {conversation.otherUser.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn(
                        'text-sm truncate',
                        conversation.unreadCount > 0 ? 'font-semibold' : 'font-medium'
                      )}>
                        {conversation.otherUser.name ?? 'Usuario'}
                      </p>
                      {conversation.lastMessage && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                            addSuffix: false,
                            locale: es,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {conversation.lastMessage && (
                        <>
                          {conversation.lastMessage.senderId === currentUserId && (
                            <span className="shrink-0">
                              {conversation.lastMessage.isRead ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : (
                                <Check className="h-3 w-3 text-muted-foreground" />
                              )}
                            </span>
                          )}
                          <p className={cn(
                            'text-xs truncate',
                            conversation.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                          )}>
                            {conversation.lastMessage.content ?? '📷 Imagen'}
                          </p>
                        </>
                      )}
                    </div>
                    {conversation.isClosed && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Archive className="h-3 w-3" />
                        Cerrada
                      </span>
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full shrink-0">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {filter === 'unread' ? 'No hay mensajes sin leer' : filter === 'closed' ? 'No hay conversaciones cerradas' : 'No hay conversaciones'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === 'all' && 'Las conversaciones con clientes aparecerán aquí'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
