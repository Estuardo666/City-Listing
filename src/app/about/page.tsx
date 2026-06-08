import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acerca de | Vive Loja',
  description: 'Conoce más sobre Vive Loja, la plataforma local para descubrir planes, lugares y oportunidades en Loja.',
}

export default function AboutPage() {
  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="space-y-3">
            <p className="eyebrow">Sobre nosotros</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Acerca de Vive Loja
            </h1>
          </div>
        </div>

        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p className="text-lg leading-relaxed">
            Vive Loja es una plataforma local diseñada para ayudarte a descubrir planes, lugares y
            oportunidades reales en tu ciudad.
          </p>
          <p>
            Nuestro objetivo es conectar a los locales y visitantes con lo mejor de Loja: desde
            restaurantes y cafés hasta eventos culturales, rutas turísticas y mucho más.
          </p>
          <p>
            Creemos en el poder de la comunidad para construir una guía útil y confiable. Cada
            reseña, cada foto y cada recomendación contribuye a hacer de Loja una ciudad más
            fácil de explorar.
          </p>
        </div>
      </section>
    </div>
  )
}
