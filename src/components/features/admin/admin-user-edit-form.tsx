'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateUserRoleAction, adminUpdateUserNameAction, deleteUserAction } from '@/actions/user/admin-update-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AdminUserDetail } from '@/lib/queries/users'

type AdminUserEditFormProps = {
  user: AdminUserDetail
  currentUserId: string
}

export function AdminUserEditForm({ user, currentUserId }: AdminUserEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(user.name ?? '')
  const [role, setRole] = useState(user.role)
  const [isDeleting, setIsDeleting] = useState(false)

  const isSelf = user.id === currentUserId

  const handleNameUpdate = () => {
    startTransition(async () => {
      const result = await adminUpdateUserNameAction({ userId: user.id, name })
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo actualizar el nombre.')
        return
      }
      toast.success('Nombre actualizado correctamente.')
      router.refresh()
    })
  }

  const handleRoleUpdate = (newRole: string) => {
    setRole(newRole)
    startTransition(async () => {
      const result = await updateUserRoleAction({ userId: user.id, role: newRole })
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo actualizar el rol.')
        setRole(user.role)
        return
      }
      toast.success('Rol actualizado correctamente.')
      router.refresh()
    })
  }

  const handleDelete = () => {
    setIsDeleting(true)
    startTransition(async () => {
      const result = await deleteUserAction(user.id)
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo eliminar el usuario.')
        setIsDeleting(false)
        return
      }
      toast.success('Usuario eliminado correctamente.')
      router.push('/admin/usuarios')
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del usuario"
                />
                <Button
                  onClick={handleNameUpdate}
                  disabled={isPending || name === (user.name ?? '')}
                  className="shrink-0"
                >
                  Guardar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={role}
                onValueChange={handleRoleUpdate}
                disabled={isSelf}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuario</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
              {isSelf && (
                <p className="text-xs text-muted-foreground">No puedes cambiar tu propio rol.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Fecha de registro</Label>
              <Input
                value={new Date(user.createdAt).toLocaleDateString('es-EC', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-muted-foreground">Locales</p>
              <p className="text-2xl font-medium">{user._count.venues}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-muted-foreground">Eventos</p>
              <p className="text-2xl font-medium">{user._count.events}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-muted-foreground">Reseñas</p>
              <p className="text-2xl font-medium">{user._count.reviews}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-muted-foreground">Artículos</p>
              <p className="text-2xl font-medium">{user._count.posts}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-muted-foreground">Favoritos</p>
              <p className="text-2xl font-medium">{user._count.favorites}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-muted-foreground">Comentarios</p>
              <p className="text-2xl font-medium">{user._count.comments}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gamificación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-muted-foreground">Reputación</p>
              <p className="text-2xl font-medium">{user.reputationScore}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-muted-foreground">Nivel</p>
              <p className="text-2xl font-medium">{user.reviewerLevel}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-muted-foreground">Check-ins</p>
              <p className="text-2xl font-medium">{user.totalCheckIns}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-muted-foreground">Votos útiles</p>
              <p className="text-2xl font-medium">{user.totalHelpfulVotes}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-200">
        <CardHeader>
          <CardTitle className="text-rose-700">Zona de peligro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La eliminación de un usuario es permanente e incluye todos sus datos: locales, eventos,
            reseñas, artículos, favoritos, comentarios y toda la información asociada.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                disabled={isSelf || isDeleting}
                className="bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Eliminar usuario permanentemente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente el usuario
                  <span className="font-semibold"> {user.name ?? user.email}</span> y todos sus datos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isSelf && (
            <p className="text-xs text-muted-foreground">No puedes eliminar tu propia cuenta desde aquí.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
