'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Search, ShieldCheck, Trash2, User2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteUserAction } from '@/actions/user/admin-update-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { cn } from '@/lib/utils'
import type { AdminUserListItem, AdminUserStats } from '@/lib/queries/users'

type AdminUsersListProps = {
  users: AdminUserListItem[]
  stats: AdminUserStats
  currentFilters: {
    q: string
    role: string
    sort: string
  }
}

const roleFilters = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Usuarios', value: 'USER' },
  { label: 'Admins', value: 'ADMIN' },
]

const sortOptions = [
  { label: 'Más recientes', value: 'newest' },
  { label: 'Más antiguos', value: 'oldest' },
  { label: 'Nombre', value: 'name' },
]

function buildFilterUrl(currentFilters: AdminUsersListProps['currentFilters'], overrides: Partial<AdminUsersListProps['currentFilters']>) {
  const params = new URLSearchParams()
  const merged = { ...currentFilters, ...overrides }

  if (merged.q) params.set('q', merged.q)
  if (merged.role !== 'ALL') params.set('role', merged.role)
  if (merged.sort !== 'newest') params.set('sort', merged.sort)

  const qs = params.toString()
  return `/admin/usuarios${qs ? `?${qs}` : ''}`
}

export function AdminUsersList({ users, stats, currentFilters }: AdminUsersListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState(currentFilters.q)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const handleSearch = () => {
    router.push(buildFilterUrl(currentFilters, { q: searchInput }))
  }

  const handleDelete = (userId: string) => {
    setDeletingUserId(userId)
    startTransition(async () => {
      const result = await deleteUserAction(userId)
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo eliminar el usuario.')
        setDeletingUserId(null)
        return
      }
      toast.success('Usuario eliminado correctamente.')
      router.refresh()
      setDeletingUserId(null)
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-xl">Resumen de usuarios</CardTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-card px-4 py-3 text-sm">
              <p className="font-semibold text-muted-foreground">Total</p>
              <p className="text-2xl font-medium">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">Usuarios</p>
              <p className="text-2xl font-medium">{stats.users}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <p className="font-semibold">Administradores</p>
              <p className="text-2xl font-medium">{stats.admins}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {roleFilters.map((filter) => (
              <Button
                key={filter.value}
                asChild
                className={cn(
                  'h-9 px-4 text-sm',
                  currentFilters.role === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border/80 bg-background text-foreground hover:bg-accent'
                )}
              >
                <Link href={buildFilterUrl(currentFilters, { role: filter.value })}>{filter.label}</Link>
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sortOptions.map((opt) => (
              <Button
                key={opt.value}
                asChild
                size="sm"
                className={cn(
                  'h-8 px-3 text-xs',
                  currentFilters.sort === opt.value
                    ? 'bg-secondary text-foreground'
                    : 'border border-border/80 bg-background text-muted-foreground hover:bg-accent'
                )}
              >
                <Link href={buildFilterUrl(currentFilters, { sort: opt.value })}>{opt.label}</Link>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 h-9"
              />
            </div>
            <Button size="sm" className="h-9" onClick={handleSearch}>
              Buscar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {users.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay usuarios para los filtros seleccionados.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => {
          const isDeletingCurrent = isPending && deletingUserId === user.id

          return (
            <Card key={user.id} className="border-border/70">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                      <User2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{user.name ?? 'Sin nombre'}</CardTitle>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold',
                    user.role === 'ADMIN'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  )}>
                    {user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                  <p><span className="font-medium">Locales:</span> {user._count.venues}</p>
                  <p><span className="font-medium">Eventos:</span> {user._count.events}</p>
                  <p><span className="font-medium">Reseñas:</span> {user._count.reviews}</p>
                  <p><span className="font-medium">Artículos:</span> {user._count.posts}</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Registrado: {new Date(user.createdAt).toLocaleDateString('es-EC', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </CardHeader>

              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <Button asChild className="h-9 border border-border/80 bg-background text-foreground hover:bg-accent">
                  <Link href={`/admin/usuarios/${user.id}/editar`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      disabled={isDeletingCurrent}
                      className="h-9 bg-rose-700 px-4 text-white hover:bg-rose-800 disabled:opacity-60"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el usuario
                        <span className="font-semibold"> {user.name ?? user.email}</span> y todos sus datos
                        (locales, eventos, reseñas, artículos, favoritos, etc.).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(user.id)}
                        className="bg-rose-600 text-white hover:bg-rose-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
