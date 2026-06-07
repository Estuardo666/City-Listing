'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Wifi } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { OsmConfigSchema, type OsmConfigInput } from '@/schemas/osm-import'

export function OsmConfigForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const form = useForm<OsmConfigInput>({
    resolver: zodResolver(OsmConfigSchema),
    defaultValues: {
      overpassUrl: 'https://overpass-api.de/api/interpreter',
      timeout: 30,
      maxResults: 1000,
      delayBetween: 1000,
      userAgent: 'ViveLoja/1.0',
      syncFrequency: null,
      syncEnabled: false,
    },
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/osm-import/config')
        if (res.ok) {
          const data = await res.json()
          if (data.config) {
            form.reset({
              overpassUrl: data.config.overpassUrl,
              timeout: data.config.timeout,
              maxResults: data.config.maxResults,
              delayBetween: data.config.delayBetween,
              userAgent: data.config.userAgent,
              syncFrequency: data.config.syncFrequency,
              syncEnabled: data.config.syncEnabled,
            })
          }
        }
      } catch {
        toast.error('Error al cargar configuración')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [form])

  const onSubmit = async (data: OsmConfigInput) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/osm-import/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast.success('Configuración guardada')
      } else {
        toast.error('Error al guardar configuración')
      }
    } catch {
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const url = form.getValues('overpassUrl')
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=[out:json][timeout:5];node(1);out;',
      })
      if (res.ok) {
        toast.success('Conexión exitosa con Overpass API')
      } else {
        toast.error(`Error de conexión: ${res.status}`)
      }
    } catch {
      toast.error('No se pudo conectar con Overpass API')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración OSM</CardTitle>
        <CardDescription>Configura los parámetros de conexión con Overpass API</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="overpassUrl">URL Overpass API</Label>
            <Input id="overpassUrl" {...form.register('overpassUrl')} />
            {form.formState.errors.overpassUrl && (
              <p className="text-sm text-destructive">{form.formState.errors.overpassUrl.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (segundos)</Label>
              <Input id="timeout" type="number" {...form.register('timeout', { valueAsNumber: true })} />
              {form.formState.errors.timeout && (
                <p className="text-sm text-destructive">{form.formState.errors.timeout.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxResults">Límite máximo por consulta</Label>
              <Input id="maxResults" type="number" {...form.register('maxResults', { valueAsNumber: true })} />
              {form.formState.errors.maxResults && (
                <p className="text-sm text-destructive">{form.formState.errors.maxResults.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delayBetween">Delay entre consultas (ms)</Label>
              <Input id="delayBetween" type="number" {...form.register('delayBetween', { valueAsNumber: true })} />
              {form.formState.errors.delayBetween && (
                <p className="text-sm text-destructive">{form.formState.errors.delayBetween.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="userAgent">User-Agent</Label>
              <Input id="userAgent" {...form.register('userAgent')} />
              {form.formState.errors.userAgent && (
                <p className="text-sm text-destructive">{form.formState.errors.userAgent.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Sincronización automática</Label>
            <div className="flex items-center gap-4">
              <Switch
                checked={form.watch('syncEnabled')}
                onCheckedChange={(checked) => form.setValue('syncEnabled', checked)}
              />
              <span className="text-sm">{form.watch('syncEnabled') ? 'Habilitada' : 'Deshabilitada'}</span>
            </div>

            {form.watch('syncEnabled') && (
              <div className="space-y-2">
                <Label>Frecuencia</Label>
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  value={form.watch('syncFrequency') ?? ''}
                  onChange={(e) => form.setValue('syncFrequency', e.target.value as any || null)}
                >
                  <option value="">Seleccionar frecuencia</option>
                  <option value="DAILY">Diaria</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="MONTHLY">Mensual</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar configuración
            </Button>
            <Button type="button" variant="outline" onClick={handleTestConnection} disabled={testing}>
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
              Probar conexión
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
