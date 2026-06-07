'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createBranchAction, linkBranchAction, unlinkBranchAction, deleteBranchAction } from '@/actions/venues/branches'
import { MapPin, Plus, Link, Unlink, Trash2, Building2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Branch {
  id: string
  name: string
  slug: string
  location: string
  address?: string | null
  status: string
  category: {
    name: string
  }
  _count: {
    reviews: number
    reservations: number
  }
}

interface AvailableVenue {
  id: string
  name: string
  location: string
}

interface BranchManagerProps {
  parentVenueId: string
  branches: Branch[]
  availableVenues: AvailableVenue[]
  categories: { id: string; name: string }[]
}

export function BranchManager({ parentVenueId, branches, availableVenues, categories }: BranchManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [unlinkConfirm, setUnlinkConfirm] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [linking, setLinking] = useState(false)

  const [newBranch, setNewBranch] = useState({
    name: '',
    description: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    categoryId: '',
  })

  const [selectedVenueId, setSelectedVenueId] = useState('')

  const handleCreateBranch = async () => {
    if (!newBranch.name.trim()) {
      toast.error('El nombre es requerido.')
      return
    }
    if (!newBranch.description.trim()) {
      toast.error('La descripción es requerida.')
      return
    }
    if (!newBranch.location.trim()) {
      toast.error('La ubicación es requerida.')
      return
    }
    if (!newBranch.categoryId) {
      toast.error('La categoría es requerida.')
      return
    }

    setCreating(true)
    try {
      const result = await createBranchAction(parentVenueId, {
        name: newBranch.name,
        description: newBranch.description,
        location: newBranch.location,
        address: newBranch.address || undefined,
        phone: newBranch.phone || undefined,
        email: newBranch.email || undefined,
        website: newBranch.website || undefined,
        categoryId: newBranch.categoryId,
      })

      if (result.success) {
        toast.success('Sucursal creada exitosamente.')
        setCreateDialogOpen(false)
        setNewBranch({
          name: '',
          description: '',
          location: '',
          address: '',
          phone: '',
          email: '',
          website: '',
          categoryId: '',
        })
      } else {
        toast.error(result.error ?? 'Error al crear sucursal.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setCreating(false)
    }
  }

  const handleLinkBranch = async () => {
    if (!selectedVenueId) {
      toast.error('Selecciona un local.')
      return
    }

    setLinking(true)
    try {
      const result = await linkBranchAction(parentVenueId, selectedVenueId)

      if (result.success) {
        toast.success('Sucursal vinculada exitosamente.')
        setLinkDialogOpen(false)
        setSelectedVenueId('')
      } else {
        toast.error(result.error ?? 'Error al vincular sucursal.')
      }
    } catch {
      toast.error('Error inesperado.')
    } finally {
      setLinking(false)
    }
  }

  const handleUnlinkBranch = async (branchId: string) => {
    try {
      const result = await unlinkBranchAction(branchId)

      if (result.success) {
        toast.success('Sucursal desvinculada.')
      } else {
        toast.error(result.error ?? 'Error al desvincular.')
      }
    } catch {
      toast.error('Error inesperado.')
    }
    setUnlinkConfirm(null)
  }

  const handleDeleteBranch = async (branchId: string) => {
    try {
      const result = await deleteBranchAction(branchId)

      if (result.success) {
        toast.success('Sucursal eliminada.')
      } else {
        toast.error(result.error ?? 'Error al eliminar.')
      }
    } catch {
      toast.error('Error inesperado.')
    }
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Sucursales</h3>
          <p className="text-xs text-muted-foreground">
            Gestiona las sucursales de tu local
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Crear
          </Button>
          <Button size="sm" variant="outline" onClick={() => setLinkDialogOpen(true)}>
            <Link className="h-4 w-4 mr-1" />
            Vincular
          </Button>
        </div>
      </div>

      {/* Branches List */}
      {branches.length > 0 ? (
        <div className="space-y-3">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Building2 className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{branch.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {branch.location}
                  </p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {branch._count.reviews} reseñas
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {branch._count.reservations} reservas
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      branch.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : branch.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {branch.status === 'APPROVED' ? 'Aprobado' : branch.status === 'PENDING' ? 'Pendiente' : 'Rechazado'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUnlinkConfirm(branch.id)}
                >
                  <Unlink className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteConfirm(branch.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg border-dashed">
          <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p>No hay sucursales vinculadas.</p>
          <p className="text-xs mt-1">Crea una nueva sucursal o vincula un local existente.</p>
        </div>
      )}

      {/* Create Branch Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear nueva sucursal</DialogTitle>
            <DialogDescription>
              Completa la información para crear una nueva sucursal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  placeholder="Ej: Pizza Hut Centro"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select
                  value={newBranch.categoryId}
                  onValueChange={(value) => setNewBranch({ ...newBranch, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción *</Label>
              <Textarea
                value={newBranch.description}
                onChange={(e) => setNewBranch({ ...newBranch, description: e.target.value })}
                placeholder="Descripción de la sucursal"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Ubicación *</Label>
              <Input
                value={newBranch.location}
                onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })}
                placeholder="Ej: Loja, Ecuador"
              />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={newBranch.address}
                onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={newBranch.phone}
                  onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                  placeholder="+593..."
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newBranch.email}
                  onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })}
                  placeholder="email@..."
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={newBranch.website}
                  onChange={(e) => setNewBranch({ ...newBranch, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBranch} disabled={creating}>
              {creating ? 'Creando...' : 'Crear Sucursal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Branch Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular sucursal existente</DialogTitle>
            <DialogDescription>
              Selecciona un local existente para vincularlo como sucursal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {availableVenues.length > 0 ? (
              <div className="space-y-2">
                <Label>Local</Label>
                <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar local" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVenues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name} - {venue.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tienes otros locales disponibles para vincular.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLinkBranch} disabled={linking || !selectedVenueId}>
              {linking ? 'Vinculando...' : 'Vincular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation */}
      <AlertDialog open={!!unlinkConfirm} onOpenChange={() => setUnlinkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desvincular sucursal?</AlertDialogTitle>
            <AlertDialogDescription>
              La sucursal dejará de estar vinculada pero no será eliminada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => unlinkConfirm && handleUnlinkBranch(unlinkConfirm)}>
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sucursal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la sucursal y todos sus datos. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDeleteBranch(deleteConfirm)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
