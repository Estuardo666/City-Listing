import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="section-shell mt-14">
      <div className="rounded-3xl border border-border/70 bg-card/80 p-6 backdrop-blur sm:p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <p className="text-lg font-semibold text-foreground">CityListing Loja</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Plataforma local para descubrir planes, lugares y oportunidades reales en tu ciudad.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Descubrir</p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/explorar" className="hover:text-foreground">Mapa en vivo</Link>
              <Link href="/eventos" className="hover:text-foreground">Eventos</Link>
              <Link href="/locales" className="hover:text-foreground">Locales</Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Recursos</p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/blog" className="hover:text-foreground">Blog y guías</Link>
              <Link href="/about" className="hover:text-foreground">Acerca de</Link>
              <Link href="/contact" className="hover:text-foreground">Contacto</Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Para negocios</p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/auth/signup" className="hover:text-foreground">Publicar negocio</Link>
              <Link href="/dashboard" className="hover:text-foreground">Panel de control</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacidad</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/70 pt-5 text-xs text-muted-foreground sm:flex sm:items-center sm:justify-between">
          <p>© 2026 CityListing Loja. Diseñado para ayudar a decidir más rápido qué hacer en la ciudad.</p>
          <p className="mt-2 sm:mt-0">Hecho en Loja para Loja.</p>
        </div>
      </div>
    </footer>
  )
}
