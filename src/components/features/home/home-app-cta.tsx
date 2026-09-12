import { Bell, MapPin, Ticket } from 'lucide-react'

function AppStoreBadge() {
  return (
    <span
      role="link"
      aria-disabled="true"
      aria-label="Descargar en el App Store — próximamente"
      className="inline-flex cursor-default select-none items-center gap-3 rounded-2xl bg-white px-5 py-3 text-neutral-900 ring-1 ring-white/40 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <svg viewBox="0 0 384 512" aria-hidden className="h-7 w-7 fill-current">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          Próximamente en
        </span>
        <span className="block text-lg font-semibold">App Store</span>
      </span>
    </span>
  )
}

const perks = [
  { icon: Bell, label: 'Avisos de los eventos que sigues' },
  { icon: MapPin, label: 'Qué hay abierto cerca de ti' },
  { icon: Ticket, label: 'Promos solo para la app' },
]

/** Maqueta del telefono: sugiere la UI de la app sin prometer pantallas reales. */
function PhoneMock() {
  return (
    <div
      aria-hidden
      className="relative w-[268px] rotate-[3deg] rounded-[2.75rem] bg-neutral-900 p-2.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/10"
    >
      <div className="overflow-hidden rounded-[2.25rem] bg-white">
        {/* Status bar */}
        <div className="relative flex items-center justify-between px-6 pb-1 pt-3 text-[11px] font-semibold text-neutral-900">
          <span>9:41</span>
          <span className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-neutral-900" />
          <span className="flex items-center gap-1">
            <span className="h-2 w-4 rounded-[2px] bg-neutral-900/80" />
            <span className="h-2 w-2 rounded-full bg-neutral-900/80" />
          </span>
        </div>

        <div className="space-y-3 px-4 pb-4 pt-3">
          <p className="text-[15px] font-semibold text-neutral-900">Hoy en Loja</p>

          {/* Buscador */}
          <div className="flex h-8 items-center gap-2 rounded-full bg-neutral-100 px-3">
            <span className="h-3 w-3 rounded-full border-[1.5px] border-neutral-400" />
            <span className="h-1.5 w-24 rounded-full bg-neutral-300" />
          </div>

          {/* Chips */}
          <div className="flex gap-1.5">
            <span className="h-5 w-14 rounded-full bg-primary" />
            <span className="h-5 w-16 rounded-full bg-neutral-100" />
            <span className="h-5 w-12 rounded-full bg-neutral-100" />
          </div>

          {/* Card grande */}
          <div className="overflow-hidden rounded-2xl ring-1 ring-neutral-200/70">
            <div className="relative h-24 bg-gradient-to-br from-primary via-primary/80 to-coral">
              <span className="absolute bottom-2 left-2 h-4 w-12 rounded-full bg-white/85" />
            </div>
            <div className="space-y-1.5 p-2.5">
              <span className="block h-2 w-3/4 rounded-full bg-neutral-300" />
              <span className="block h-1.5 w-1/2 rounded-full bg-neutral-200" />
            </div>
          </div>

          {/* Fila lista */}
          <div className="flex items-center gap-2.5">
            <span className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-emerald to-emerald/60" />
            <span className="flex-1 space-y-1.5">
              <span className="block h-2 w-4/5 rounded-full bg-neutral-300" />
              <span className="block h-1.5 w-2/5 rounded-full bg-neutral-200" />
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-coral to-coral/60" />
            <span className="flex-1 space-y-1.5">
              <span className="block h-2 w-3/5 rounded-full bg-neutral-300" />
              <span className="block h-1.5 w-1/2 rounded-full bg-neutral-200" />
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center justify-around border-t border-neutral-200/80 px-6 py-3">
          <span className="h-4 w-4 rounded-md bg-primary" />
          <span className="h-4 w-4 rounded-md bg-neutral-200" />
          <span className="h-4 w-4 rounded-md bg-neutral-200" />
          <span className="h-4 w-4 rounded-full bg-neutral-200" />
        </div>
      </div>
    </div>
  )
}

export function HomeAppCta() {
  return (
    <section
      aria-labelledby="app-cta-title"
      className="relative isolate overflow-hidden rounded-[2rem] px-6 py-12 sm:px-10 sm:py-16 lg:px-16"
      style={{
        backgroundImage:
          'radial-gradient(120% 120% at 85% 0%, rgba(59,130,246,0.35) 0%, rgba(10,31,60,0) 55%), linear-gradient(140deg, #0A1F3C 0%, #10305B 55%, #0A1F3C 100%)',
      }}
    >
      {/* Trama de puntos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(80% 70% at 20% 40%, #000 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(80% 70% at 20% 40%, #000 20%, transparent 75%)',
        }}
      />

      <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-8">
        <div className="max-w-lg space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/80 ring-1 ring-inset ring-white/15">
            App para iPhone
          </span>

          <h2
            id="app-cta-title"
            className="text-[2rem] font-medium leading-[1.1] tracking-tight !text-white sm:text-[2.75rem]"
          >
            Loja entera,
            <br />
            en tu bolsillo.
          </h2>

          <p className="max-w-md text-base leading-relaxed !text-white/70">
            Eventos, locales y promociones de la ciudad, actualizados a diario. Llevamos Vive Loja
            al iPhone.
          </p>

          <ul className="grid gap-3 sm:grid-cols-1">
            {perks.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/15">
                  <Icon className="h-4 w-4 text-white" />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <AppStoreBadge />
          </div>
        </div>

        {/* Maqueta: recortada por el borde inferior para dar profundidad */}
        <div className="relative hidden justify-self-end lg:block">
          <div
            aria-hidden
            className="absolute -inset-10 -z-10 rounded-full bg-primary/25 blur-3xl"
          />
          <div className="-mb-24 translate-y-6">
            <PhoneMock />
          </div>
        </div>
      </div>
    </section>
  )
}
