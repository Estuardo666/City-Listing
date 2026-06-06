'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { subscribeNewsletterAction } from '@/actions/newsletter'

interface NewsletterFormProps {
  className?: string
  compact?: boolean
}

export function NewsletterForm({ className = '', compact = false }: NewsletterFormProps) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await subscribeNewsletterAction({
        email,
        name: name || null,
      })

      if (result.success) {
        toast.success('Suscripción exitosa.')
        setSubmitted(true)
        setEmail('')
        setName('')
      } else {
        toast.error(result.error ?? 'Error al suscribirse.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-sm font-medium text-emerald-600">
          ¡Gracias por suscribirte!
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Recibirás nuestras novedades pronto.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {!compact && (
        <h3 className="font-semibold mb-1">Suscríbete al newsletter</h3>
      )}
      {!compact && (
        <p className="text-xs text-muted-foreground mb-3">
          Recibe eventos y novedades de Loja directamente en tu correo.
        </p>
      )}
      <div className={`flex gap-2 ${compact ? '' : 'flex-col sm:flex-row'}`}>
        {!compact && (
          <Input
            placeholder="Tu nombre (opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-sm"
          />
        )}
        <Input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="text-sm"
        />
        <Button type="submit" disabled={loading} size={compact ? 'sm' : 'default'}>
          {loading ? '...' : 'Suscribirse'}
        </Button>
      </div>
    </form>
  )
}
