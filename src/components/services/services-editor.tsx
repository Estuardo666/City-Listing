'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { togglePredefinedServiceAction, addCustomServiceAction, updateCustomServiceAction, deleteServiceAction } from '@/actions/services/manage-services'
import { PREDEFINED_SERVICES } from '@/lib/constants/services'
import { Plus, Trash2, Edit, X, Check } from 'lucide-react'
import type { VenueService } from '@prisma/client'

interface ServicesEditorProps {
  venueId: string
  initialServices: VenueService[]
}

export function ServicesEditor({ venueId, initialServices }: ServicesEditorProps) {
  const [services, setServices] = useState<VenueService[]>(initialServices)
  const [loading, setLoading] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customForm, setCustomForm] = useState({ name: '', description: '', icon: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', icon: '' })

  function isServiceActive(name: string): boolean {
    return services.some((s) => s.name === name && s.isActive)
  }

  function getServiceId(name: string): string | undefined {
    return services.find((s) => s.name === name)?.id
  }

  async function handleToggle(serviceName: string) {
    setLoading(true)
    const result = await togglePredefinedServiceAction(venueId, serviceName)
    setLoading(false)
    if (result.success && result.data) {
      setServices((prev) => {
        const exists = prev.find((s) => s.name === serviceName)
        if (exists) return prev.map((s) => (s.name === serviceName ? { ...s, isActive: !s.isActive } : s))
        return [...prev, result.data!]
      })
      toast.success('Servicio actualizado.')
    } else {
      toast.error(result.error ?? 'Error.')
    }
  }

  async function handleAddCustom() {
    if (!customForm.name.trim()) return
    setLoading(true)
    const result = await addCustomServiceAction(venueId, {
      name: customForm.name.trim(),
      description: customForm.description || null,
      icon: customForm.icon || '✨',
    })
    setLoading(false)
    if (result.success && result.data) {
      setServices((prev) => [...prev, result.data!])
      setCustomForm({ name: '', description: '', icon: '' })
      setShowCustomForm(false)
      toast.success('Servicio personalizado creado.')
    } else {
      toast.error(result.error ?? 'Error.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return
    setLoading(true)
    const result = await deleteServiceAction(id)
    setLoading(false)
    if (result.success) {
      setServices((prev) => prev.filter((s) => s.id !== id))
      toast.success('Eliminado.')
    } else {
      toast.error(result.error ?? 'Error.')
    }
  }

  async function handleUpdate(id: string) {
    if (!editForm.name.trim()) return
    setLoading(true)
    const result = await updateCustomServiceAction(id, editForm)
    setLoading(false)
    if (result.success && result.data) {
      setServices((prev) => prev.map((s) => (s.id === id ? result.data! : s)))
      setEditingId(null)
      toast.success('Actualizado.')
    } else {
      toast.error(result.error ?? 'Error.')
    }
  }

  const customServices = services.filter((s) => s.isCustom)

  return (
    <div className="space-y-6">
      {/* Predefined services */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Servicios disponibles</h3>
        <div className="grid gap-2">
          {PREDEFINED_SERVICES.map((ps) => {
            const active = isServiceActive(ps.name)
            return (
              <div
                key={ps.name}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                  active ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-card border-border/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ps.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{ps.name}</p>
                    <p className="text-xs text-muted-foreground">{ps.description}</p>
                  </div>
                </div>
                <Switch
                  checked={active}
                  onCheckedChange={() => handleToggle(ps.name)}
                  disabled={loading}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Custom services */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Servicios personalizados</h3>
        {customServices.length > 0 && (
          <div className="grid gap-2">
            {customServices.map((cs) => (
              <div key={cs.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3">
                {editingId === cs.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editForm.icon}
                      onChange={(e) => setEditForm((p) => ({ ...p, icon: e.target.value }))}
                      className="w-14 text-center text-sm"
                      placeholder="✨"
                    />
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      className="flex-1 text-sm"
                      placeholder="Nombre"
                    />
                    <Input
                      value={editForm.description}
                      onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                      className="flex-1 text-sm"
                      placeholder="Descripción"
                    />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleUpdate(cs.id)} disabled={loading}>
                      <Check className="h-4 w-4 text-emerald-600" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cs.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{cs.name}</p>
                        {cs.description && <p className="text-xs text-muted-foreground">{cs.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditingId(cs.id)
                          setEditForm({ name: cs.name, description: cs.description ?? '', icon: cs.icon ?? '' })
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(cs.id)} disabled={loading}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {showCustomForm ? (
          <div className="flex gap-2">
            <Input
              placeholder="✨"
              value={customForm.icon}
              onChange={(e) => setCustomForm((p) => ({ ...p, icon: e.target.value }))}
              className="w-14 text-center text-sm"
            />
            <Input
              placeholder="Nombre del servicio"
              value={customForm.name}
              onChange={(e) => setCustomForm((p) => ({ ...p, name: e.target.value }))}
              className="flex-1 text-sm"
            />
            <Input
              placeholder="Descripción (opcional)"
              value={customForm.description}
              onChange={(e) => setCustomForm((p) => ({ ...p, description: e.target.value }))}
              className="flex-1 text-sm"
            />
            <Button size="sm" onClick={handleAddCustom} disabled={loading}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowCustomForm(false); setCustomForm({ name: '', description: '', icon: '' }) }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowCustomForm(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Agregar servicio personalizado
          </Button>
        )}
      </div>
    </div>
  )
}
