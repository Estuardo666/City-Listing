'use client'

import { useState, useRef, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User2, Lock, Loader2, Image as ImageIcon, Upload } from 'lucide-react'
import { updateNameAction, updatePasswordAction, updateImageAction } from '@/actions/user/update-profile'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const nameSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(60),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type NameInput = z.infer<typeof nameSchema>
type PasswordInput = z.infer<typeof passwordSchema>

type ProfileFormProps = {
  currentName: string
  hasPassword: boolean
  currentImage: string | null
}

export function ProfileForm({ currentName, hasPassword, currentImage }: ProfileFormProps) {
  const [nameLoading, setNameLoading] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(currentImage)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const nameForm = useForm<NameInput>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: currentName },
  })

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onNameSubmit = async (data: NameInput) => {
    setNameLoading(true)
    const result = await updateNameAction(data)
    setNameLoading(false)
    if (result.success) {
      toast.success('Nombre actualizado correctamente.')
    } else {
      toast.error(result.error ?? 'Error al actualizar el nombre')
    }
  }

  const onPasswordSubmit = async (data: PasswordInput) => {
    setPassLoading(true)
    const result = await updatePasswordAction(data)
    setPassLoading(false)
    if (result.success) {
      toast.success('Contraseña actualizada correctamente.')
      passwordForm.reset()
    } else {
      toast.error(result.error ?? 'Error al actualizar la contraseña')
    }
  }

  const onImageSubmit = async () => {
    if (!imageUrl || imageUrl === currentImage) return
    setImageLoading(true)
    const result = await updateImageAction({ image: imageUrl })
    setImageLoading(false)
    if (result.success) {
      toast.success('Foto de perfil actualizada correctamente.')
      // Force a soft reload to update session image
      window.location.reload()
    } else {
      toast.error(result.error ?? 'Error al actualizar la foto de perfil')
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen')
      return
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no debe superar 5MB')
      return
    }

    setImageLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/uploads/media', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      
      if (result.success && result.data?.url) {
        setImageUrl(result.data.url)
        toast.success('Imagen subida correctamente. Haz clic en "Guardar foto" para aplicar.')
      } else {
        toast.error(result.error || 'Error al subir la imagen')
      }
    } catch (error) {
      toast.error('Error al subir la imagen')
    } finally {
      setImageLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Image section */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
            <ImageIcon className="h-4 w-4 text-accent-foreground" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Foto de perfil</h2>
            <p className="text-xs text-muted-foreground">Así te verán otros usuarios en la plataforma.</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-border/60 bg-accent">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <Input
              type="url"
              placeholder="Pega una URL de imagen o sube un archivo"
              value={imageUrl ?? ''}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageLoading}
                className="h-9"
              >
                {imageLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span className="ml-2">Subir archivo</span>
              </Button>
              <span className="text-xs text-muted-foreground">Máx. 5MB</span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={onImageSubmit}
                disabled={imageLoading || !imageUrl || imageUrl === currentImage}
                className="h-9 shrink-0"
              >
                {imageLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span className="ml-2">Guardar foto</span>
              </Button>
              {currentImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImageUrl(null)
                    updateImageAction({ image: null }).then((result) => {
                      if (result.success) {
                        toast.success('Foto de perfil eliminada.')
                        window.location.reload()
                      } else {
                        toast.error(result.error ?? 'Error al eliminar la foto')
                      }
                    })
                  }}
                  className="h-9"
                >
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Name section */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
            <User2 className="h-4 w-4 text-accent-foreground" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Nombre de perfil</h2>
            <p className="text-xs text-muted-foreground">Así te verán otros usuarios en la plataforma.</p>
          </div>
        </div>

        <Form {...nameForm}>
          <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="flex gap-3">
            <FormField
              control={nameForm.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Tu nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={nameLoading} className="h-10 shrink-0">
              {nameLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
            </Button>
          </form>
        </Form>
      </div>

      {/* Password section */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
            <Lock className="h-4 w-4 text-accent-foreground" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Contraseña</h2>
            <p className="text-xs text-muted-foreground">
              {hasPassword
                ? 'Cambia tu contraseña de acceso.'
                : 'Tu cuenta usa inicio de sesión con Google. No puedes cambiar la contraseña.'}
            </p>
          </div>
        </div>

        {hasPassword ? (
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña actual</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mín. 8 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Repite la contraseña" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={passLoading} className="h-10">
                  {passLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cambiar contraseña'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="rounded-xl border border-border/40 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Cuenta vinculada con Google. El cambio de contraseña no está disponible.
          </div>
        )}
      </div>
    </div>
  )
}
