import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacto | Vive Loja',
  description:
    '¿Preguntas, sugerencias o quieres colaborar? Ponte en contacto con el equipo de Vive Loja. Estamos aquí para ayudarte.',
  openGraph: {
    title: 'Contacto | Vive Loja',
    description: '¿Preguntas o sugerencias? Ponte en contacto con el equipo de Vive Loja.',
    url: 'https://viveloja.com/contact',
    siteName: 'Vive Loja',
    images: [{ url: 'https://viveloja.com/viveloja.png', width: 1200, height: 630, alt: 'Contacto - Vive Loja' }],
    locale: 'es_EC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contacto | Vive Loja',
    description: '¿Preguntas o sugerencias? Ponte en contacto con el equipo de Vive Loja.',
    images: ['https://viveloja.com/viveloja.png'],
  },
  alternates: { canonical: 'https://viveloja.com/contact' },
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const isEnterprise = (await searchParams).plan === 'enterprise'

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="space-y-3">
            <p className="eyebrow">Contáctanos</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              {isEnterprise ? 'Hablemos de Enterprise' : 'Contacto'}
            </h1>
          </div>
        </div>

        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p className="text-lg leading-relaxed">
            {isEnterprise ? 'Cuéntanos cuántas ubicaciones tienes y qué necesita tu operación. Diseñaremos contigo la configuración adecuada.' : '¿Tienes preguntas, sugerencias o quieres colaborar con nosotros? Nos encantaría saber de ti.'}
          </p>

          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
            <div>
              <p className="font-medium text-foreground">Email</p>
              <a className="text-primary underline-offset-4 hover:underline" href={`mailto:contacto@viveloja.com?subject=${encodeURIComponent(isEnterprise ? 'Solicitud Enterprise · Vive Loja' : 'Contacto · Vive Loja')}`}>contacto@viveloja.com</a>
            </div>
            <div>
              <p className="font-medium text-foreground">Redes sociales</p>
              <p>Síguenos en nuestras redes para estar al día con los mejores planes de la ciudad.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
