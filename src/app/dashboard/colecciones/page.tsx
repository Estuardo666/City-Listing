import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserCollections } from '@/lib/queries/features'
import { CollectionCreateForm } from './collection-create-form'
import { Folder, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { DeleteCollectionButton } from './delete-collection-button'

export const metadata = { title: 'Mis Colecciones — Vive Loja' }

export default async function CollectionsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const collections = await getUserCollections(session.user.id)

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dashboard</p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl flex items-center gap-2">
              <Folder className="h-6 w-6" /> Mis Colecciones
            </h1>
          </div>
          <CollectionCreateForm />
        </div>

        {collections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Folder className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">No tienes colecciones</p>
            <p className="mt-1 text-sm text-muted-foreground">Crea colecciones para organizar tus favoritos</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <div key={col.id} className="group relative rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/25">
              <Link href={`/dashboard/colecciones/${col.id}`} className="block">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{col.icon ?? '📁'}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{col.name}</h3>
                    <p className="text-xs text-muted-foreground">{col._count.items} {col._count.items === 1 ? 'elemento' : 'elementos'}</p>
                  </div>
                </div>
              </Link>
              <DeleteCollectionButton collectionId={col.id} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
