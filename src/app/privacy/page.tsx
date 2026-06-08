import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Vive Loja',
  description: 'Conoce cómo Vive Loja protege y maneja tus datos personales.',
}

export default function PrivacyPage() {
  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-8">
        <div className="surface-glass rounded-3xl p-6 sm:p-8">
          <div className="space-y-3">
            <p className="eyebrow">Legal</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Política de Privacidad
            </h1>
          </div>
        </div>

        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p className="text-lg leading-relaxed">
            En Vive Loja, tu privacidad es importante. Esta política describe cómo recopilamos,
            usamos y protegemos tu información.
          </p>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Información que recopilamos</h2>
            <p>
              Recopilamos información que proporcionas directamente, como tu nombre, email y
              contenido que publicas (reseñas, fotos, comentarios).
            </p>

            <h2 className="text-xl font-semibold text-foreground">Uso de la información</h2>
            <p>
              Utilizamos tu información para operar y mejorar la plataforma, personalizar tu
              experiencia y comunicarnos contigo sobre tu actividad.
            </p>

            <h2 className="text-xl font-semibold text-foreground">Protección de datos</h2>
            <p>
              Implementamos medidas de seguridad apropiadas para proteger tu información personal
              contra acceso no autorizado, alteración o destrucción.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
