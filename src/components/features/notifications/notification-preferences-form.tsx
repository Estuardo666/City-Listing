'use client'

import { useEffect, useState } from 'react'
import { useForm, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { notificationPreferencesSchema, type NotificationPreferencesInput } from '@/schemas/notification.schema'
import { getNotificationPreferencesAction, updateNotificationPreferencesAction } from '@/actions/notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

type BooleanPreferenceName = Exclude<keyof NotificationPreferencesInput, 'hoursAhead'>

export function NotificationPreferencesForm() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<NotificationPreferencesInput>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      enabled: true,
      hoursAhead: 48,
      pushEnabled: true,
      emailEnabled: true,
      eventReminders: true,
      newFollowedVenuePost: true,
      reviewReply: true,
      claimUpdates: true,
      messageReceived: true,
      moderationUpdates: true,
    },
  })

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const result = await getNotificationPreferencesAction()

      if (!result.success || !result.data) {
        toast.error(result.error ?? 'No se pudieron cargar las preferencias.')
        setIsLoading(false)
        return
      }

      form.reset(result.data)

      setIsLoading(false)
    }

    void load()
  }, [form])

  const onSubmit = async (values: NotificationPreferencesInput) => {
    setIsSubmitting(true)

    try {
      const result = await updateNotificationPreferencesAction(values)

      if (result.success) {
        toast.success('Preferencias guardadas')
      } else {
        toast.error(result.error ?? 'No se pudieron guardar las preferencias.')
      }
    } catch {
      toast.error('No se pudieron guardar las preferencias.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ToggleField
          control={form.control}
          name="enabled"
          label="Notificaciones activas"
          description="Interruptor general: si se apaga, no se envía nada por ningún canal."
        />

        <FormField
          control={form.control}
          name="hoursAhead"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horas por adelantado</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Cuántas horas hacia el futuro se consideran &quot;próximos eventos&quot;.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Canales</h3>
          <ToggleField
            control={form.control}
            name="pushEnabled"
            label="Push"
            description="Notificaciones en el teléfono y en la app instalada."
          />
          <ToggleField control={form.control} name="emailEnabled" label="Correo" />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Qué quieres recibir</h3>
          <ToggleField
            control={form.control}
            name="eventReminders"
            label="Recordatorios de eventos guardados"
          />
          <ToggleField
            control={form.control}
            name="newFollowedVenuePost"
            label="Novedades de locales que sigues"
          />
          <ToggleField control={form.control} name="reviewReply" label="Respuestas a mis reseñas" />
          <ToggleField control={form.control} name="messageReceived" label="Mensajes nuevos" />
          <ToggleField
            control={form.control}
            name="claimUpdates"
            label="Estado de mis reclamos de negocio"
          />
          <ToggleField
            control={form.control}
            name="moderationUpdates"
            label="Resultado de la revisión de lo que publico"
          />
        </div>

        <Button type="submit" disabled={isLoading || isSubmitting}>
          {isLoading ? 'Cargando...' : isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Form>
  )
}

/** Boolean preference rendered as a switch, so the list reads as one control. */
function ToggleField({
  control,
  name,
  label,
  description,
}: {
  control: Control<NotificationPreferencesInput>
  name: BooleanPreferenceName
  label: string
  description?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <FormLabel>{label}</FormLabel>
            {description ? <FormDescription>{description}</FormDescription> : null}
          </div>
          <FormControl>
            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
