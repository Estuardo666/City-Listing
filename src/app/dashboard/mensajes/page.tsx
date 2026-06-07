'use client'

import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Inbox } from '@/components/messaging/inbox'
import { MessageThread } from '@/components/messaging/message-thread'
import { MessageSquare } from 'lucide-react'

interface Conversation {
  id: string
  venueId: string
  venueName: string
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

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (session?.user?.id) {
      loadConversations()
    }
  }, [session])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages()
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    if (!selectedConversation) return
    try {
      const response = await fetch(`/api/messages/conversations/${selectedConversation}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId)
  }

  const handleCloseConversation = () => {
    loadConversations()
  }

  const handleReopenConversation = () => {
    loadConversations()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="pb-16 pt-8">
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const currentConversation = conversations.find((c) => c.id === selectedConversation)

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="space-y-1 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mensajes
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Bandeja de Entrada
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las conversaciones con tus clientes de todos tus locales.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* Inbox */}
            <div className="border-r md:col-span-1">
              <Inbox
                conversations={conversations}
                currentUserId={session?.user?.id ?? ''}
                selectedConversationId={selectedConversation ?? undefined}
                onSelectConversation={handleSelectConversation}
              />
            </div>

            {/* Message Thread */}
            <div className="md:col-span-2">
              {currentConversation ? (
                <MessageThread
                  conversationId={currentConversation.id}
                  venueId={currentConversation.venueId}
                  otherUser={currentConversation.otherUser}
                  messages={messages}
                  currentUserId={session?.user?.id ?? ''}
                  isClosed={currentConversation.isClosed}
                  onCloseConversation={handleCloseConversation}
                  onReopenConversation={handleReopenConversation}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Selecciona una conversación
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Las conversaciones con clientes aparecerán aquí
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
