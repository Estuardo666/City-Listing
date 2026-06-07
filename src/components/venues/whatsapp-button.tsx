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
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1da851] ${className}`}
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
      className={`flex items-center justify-center gap-3 rounded-xl bg-[#25D366] px-4 py-3 text-base font-bold text-white transition-colors hover:bg-[#1da851] ${className}`}
    >
      <MessageCircle className="h-5 w-5 shrink-0" />
      {label}
    </a>
  )
}
