'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { updatePostAction } from '@/actions/posts'
import { postSchema, type PostInput } from '@/schemas/post.schema'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaUrlInput } from '@/components/features/media/media-url-input'
import { TagInput } from '@/components/features/blog/tag-input'
import type { PostCategory } from '@/types/post'

type PostEditFormProps = {
  postId: string
  categories: PostCategory[]
  initialData: PostInput
}

export function PostEditForm({ postId, categories, initialData }: PostEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData.title,
      excerpt: initialData.excerpt ?? null,
      content: initialData.content,
      image: initialData.image ?? null,
      categoryId: initialData.categoryId,
      featured: initialData.featured ?? false,
      tags: initialData.tags ?? [],
    },
  })

  const onSubmit = async (data: PostInput) => {
    setIsSubmitting(true)
    try {
      const result = await updatePostAction(postId, data)
      if (result.success) {
        toast.success('Artículo actualizado correctamente.')
        router.push('/dashboard/blog')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Error al actualizar el artículo')
      }
    } catch {
      toast.error('Error al actualizar el artículo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Título del artículo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Los mejores lugares para visitar en Loja" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {categories.map((category, i) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <SelectItem value={category.id}>
                            {category.icon ?? ''} {category.name}
                          </SelectItem>
                        </motion.div>
                      ))}
                    </motion.div>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <MediaUrlInput
                label="Imagen de portada (URL)"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                placeholder="https://..."
              />
            )}
          />

          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Resumen (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Breve descripción del artículo..."
                    rows={2}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Contenido del artículo</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Escribe el contenido completo del artículo aquí..."
                    rows={14}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Etiquetas <span className="text-muted-foreground font-normal">(opcional, máx. 8)</span></FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Escribe y presiona Enter o coma…"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/blog')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando cambios...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
