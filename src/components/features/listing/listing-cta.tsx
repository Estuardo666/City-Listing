import Link from 'next/link'
import { ArrowRight, Store, CalendarDays } from 'lucide-react'

type ListingCtaProps = {
  type: 'venues' | 'events'
}

export function ListingCta({ type }: ListingCtaProps) {
  const isVenues = type === 'venues'

  return (
    <section className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-secondary/30">
      <div className="flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          {isVenues ? (
            <Store className="h-7 w-7 text-primary" />
          ) : (
            <CalendarDays className="h-7 w-7 text-primary" />
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isVenues
              ? 'Tienes un negocio? Registralo gratis'
              : 'Organizas eventos? Publicalos aqui'}
          </h3>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            {isVenues
              ? 'Forma parte del directorio mas completo de Loja. Aumenta tu visibilidad y conecta con nuevos clientes.'
              : 'Llega a miles de personas interesadas en eventos locales. Publica tu evento y llena tus espacios.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={isVenues ? '/locales/crear' : '/eventos/crear'}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
          >
            {isVenues ? 'Registrar local' : 'Publicar evento'}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {!isVenues && (
            <Link
              href="/locales/crear"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Registrar local
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
