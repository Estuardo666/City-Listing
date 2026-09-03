'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  disableWebPush,
  enableWebPush,
  getWebPushStatus,
  isSubscribedToWebPush,
  type WebPushStatus,
} from '@/lib/web-push-client'

/**
 * Opt-in for browser and installed-app notifications.
 *
 * The permission prompt fires from the button, never on page load: a prompt the
 * user did not ask for is usually dismissed, and a dismissal is permanent.
 */
export function WebPushOptIn() {
  const [status, setStatus] = useState<WebPushStatus>('unsupported')
  const [subscribed, setSubscribed] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    setStatus(getWebPushStatus())
    void isSubscribedToWebPush().then(setSubscribed)
  }, [])

  if (status === 'unsupported') {
    return (
      <p className="text-sm text-muted-foreground">
        Este navegador no admite notificaciones. En iPhone, añade Vive Loja a la pantalla de inicio
        para activarlas.
      </p>
    )
  }

  if (status === 'unconfigured') {
    return (
      <p className="text-sm text-muted-foreground">
        Las notificaciones web aún no están configuradas en este entorno.
      </p>
    )
  }

  if (status === 'denied') {
    return (
      <p className="text-sm text-muted-foreground">
        Bloqueaste las notificaciones para este sitio. Actívalas desde los permisos del navegador.
      </p>
    )
  }

  const handleEnable = async () => {
    setIsBusy(true)
    try {
      const result = await enableWebPush()
      setStatus(result.status)
      setSubscribed(result.ok)
      if (result.ok) toast.success('Notificaciones activadas en este dispositivo.')
      else if (result.status === 'denied') toast.error('Permiso denegado por el navegador.')
      else toast.error('No se pudieron activar las notificaciones.')
    } catch {
      toast.error('No se pudieron activar las notificaciones.')
    } finally {
      setIsBusy(false)
    }
  }

  const handleDisable = async () => {
    setIsBusy(true)
    try {
      const ok = await disableWebPush()
      setSubscribed(!ok)
      if (ok) toast.success('Este dispositivo dejará de recibir notificaciones.')
    } catch {
      toast.error('No se pudieron desactivar las notificaciones.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {subscribed
          ? 'Este dispositivo recibe notificaciones de Vive Loja.'
          : 'Recibe avisos de tus eventos guardados y respuestas, aunque no tengas la web abierta.'}
      </p>
      {subscribed ? (
        <Button variant="outline" onClick={handleDisable} disabled={isBusy}>
          Desactivar en este dispositivo
        </Button>
      ) : (
        <Button onClick={handleEnable} disabled={isBusy}>
          Activar notificaciones
        </Button>
      )}
    </div>
  )
}
