import { getPublicCollections } from '@/lib/queries/features'
import { Folder, User } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const metadata = {
  title: 'Colecciones — Vive Loja',
  description:
    'Listas curadas por la comunidad de Loja: los mejores locales, eventos y planes organizados por temas. Descubre recomendaciones personalizadas de tu ciudad.',
  openGraph: {
    title: 'Colecciones de Locales y Eventos | Vive Loja',
    description: 'Listas curadas por la comunidad de Loja con los mejores locales, eventos y planes.',
    url: 'https://viveloja.com/colecciones',
    siteName: 'Vive Loja',
    images: [{ url: 'https://viveloja.com/viveloja.png', width: 1200, height: 630, alt: 'Colecciones - Vive Loja' }],
    locale: 'es_EC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Colecciones de Locales y Eventos',
    description: 'Listas curadas por la comunidad de Loja con los mejores locales, eventos y planes.',
    images: ['https://viveloja.com/viveloja.png'],
  },
  alternates: { canonical: 'https://viveloja.com/colecciones' },
}
export const dynamic = 'force-dynamic'

export default async function CollectionsExplorePage() {
  const collections = await getPublicCollections(20)

  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <section className="section-shell space-y-8">
        <div>
          <h1 className="text-2xl font-medium sm:text-3xl">Colecciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Listas curadas por la comunidad de Loja
          </p>
        </div>

        {collections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Folder className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">No hay colecciones públicas</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/colecciones/${col.slug}`}
              className="group rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/25"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{col.icon ?? '📁'}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate">{col.name}</h3>
                  <p className="text-xs text-muted-foreground">{col._count.items} elementos</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-[8px]">{col.user.name?.charAt(0) ?? '?'}</AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground">{col.user.name ?? 'Anónimo'}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
