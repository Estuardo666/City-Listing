import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acerca de | Vive Loja',
  description:
    'Vive Loja es la plataforma local para descubrir planes, lugares y oportunidades reales en Loja, Ecuador. Conectamos a locales y visitantes con lo mejor de la ciudad.',
  openGraph: {
    title: 'Acerca de Vive Loja',
    description: 'La plataforma local para descubrir planes, lugares y oportunidades en Loja, Ecuador.',
    url: 'https://viveloja.com/about',
    siteName: 'Vive Loja',
    images: [{ url: 'https://viveloja.com/viveloja.png', width: 1200, height: 630, alt: 'Acerca de Vive Loja' }],
    locale: 'es_EC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Acerca de Vive Loja',
    description: 'La plataforma local para descubrir planes, lugares y oportunidades en Loja, Ecuador.',
    images: ['https://viveloja.com/viveloja.png'],
  },
  alternates: { canonical: 'https://viveloja.com/about' },
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
