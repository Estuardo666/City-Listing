import Link from 'next/link'
import type { ReactNode } from 'react'

export function LegalPage({ eyebrow, title, summary, children }: { eyebrow: string; title: string; summary: string; children: ReactNode }) {
  return <main className="pb-20 pt-20"><article className="section-shell max-w-4xl">
    <header className="border-b border-border pb-10"><p className="eyebrow text-primary">{eyebrow}</p><h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{summary}</p><p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Vigente desde el 11 de septiembre de 2026</p></header>
    <div className="prose-legal mt-10 space-y-9 text-base leading-7 text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-2 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-6">{children}</div>
    <footer className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-6 text-sm"><Link href="/terminos">Términos</Link><Link href="/privacy">Privacidad</Link><Link href="/reembolsos">Reembolsos</Link><Link href="/cookies">Cookies</Link><Link href="/normas-comunidad">Normas de comunidad</Link></footer>
  </article></main>
}
