'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { notificationPreferencesSchema, type NotificationPreferencesInput } from '@/schemas/notification.schema'
import { getNotificationPreferencesAction, updateNotificationPreferencesAction } from '@/actions/notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export function NotificationPreferencesForm() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<NotificationPreferencesInput>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      enabled: true,
      hoursAhead: 48,
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

      form.reset({
        enabled: result.data.enabled,
        hoursAhead: result.data.hoursAhead,
      })

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
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notificaciones activas</FormLabel>
              <FormControl>
                <Input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </FormControl>
              <FormDescription>
                Si está desactivado, no se enviarán alertas de eventos próximos.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
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
                Cuántas horas hacia el futuro se consideran "próximos eventos".
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading || isSubmitting}>
          {isLoading ? 'Cargando...' : isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Form>
  )
}
