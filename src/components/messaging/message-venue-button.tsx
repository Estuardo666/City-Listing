'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { sendMessageAction } from '@/actions/messaging/messages'
import { MessageSquare, X, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MessageVenueButtonProps {
  venueId: string
  venueOwnerId: string
  venueName: string
  currentUserId?: string
}

export function MessageVenueButton({ venueId, venueOwnerId, venueName, currentUserId }: MessageVenueButtonProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  if (!currentUserId || currentUserId === venueOwnerId) {
    return null
  }

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Escribe un mensaje.')
      return
    }

    setSending(true)
    try {
      const result = await sendMessageAction(venueId, venueOwnerId, message.trim())
      if (result.success) {
        toast.success('Mensaje enviado. El negocio te responderá pronto.')
        setMessage('')
        setOpen(false)
      } else {
        toast.error(result.error ?? 'Error al enviar mensaje.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full gap-2"
        variant="outline"
        size="lg"
      >
        <MessageSquare className="h-4 w-4" />
        Enviar mensaje
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Enviar mensaje
            </DialogTitle>
            <DialogDescription>
              Envía un mensaje a <strong>{venueName}</strong>. Te responderán desde su bandeja de entrada.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="min-h-[120px] resize-none"
              maxLength={1000}
              disabled={sending}
            />
            <p className="mt-2 text-xs text-muted-foreground text-right">
              {message.length}/1000 caracteres
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              {sending ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
