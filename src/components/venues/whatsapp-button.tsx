'use client'

import { MessageCircle } from 'lucide-react'
import { buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/whatsapp'

type WhatsAppButtonProps = {
  phone: string
  venueName: string
  hasMenu?: boolean
  acceptsReservations?: boolean
  variant?: 'full' | 'compact'
  className?: string
}

export function WhatsAppButton({
  phone,
  venueName,
  hasMenu = false,
  acceptsReservations = false,
  variant = 'full',
  className = '',
}: WhatsAppButtonProps) {
  const message = buildWhatsAppMessage({ name: venueName, hasMenu, acceptsReservations })
  const url = buildWhatsAppUrl(phone, message)

  if (!url) return null

  const label = acceptsReservations
    ? 'Reservar por WhatsApp'
    : hasMenu
      ? 'Pedir por WhatsApp'
      : 'Contactar por WhatsApp'

  if (variant === 'compact') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#1da851] hover:shadow-lg ${className}`}
        aria-label={label}
      >
        <MessageCircle className="h-4 w-4" />
        {label}
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 p-4 transition-all hover:bg-[#25D366]/20 hover:shadow-md ${className}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
        <MessageCircle className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">WhatsApp</p>
        <p className="text-sm font-bold text-[#25D366]">{label}</p>
      </div>
    </a>
  )
}
