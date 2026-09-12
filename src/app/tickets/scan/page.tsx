import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Ticket, XCircle } from 'lucide-react'
import { getPublicTicketByQrToken } from '@/lib/ticketing'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

type TicketScanPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function TicketScanPage({ searchParams }: TicketScanPageProps) {
  const token = first((await searchParams).token)
  if (!token) notFound()
  const ticket = await getPublicTicketByQrToken(token).catch(() => null)
  if (!ticket) notFound()
  const valid = ticket.status !== 'VOID'
  return (
    <main className="section-shell py-12 sm:py-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-border/60 bg-card p-6 shadow-sm sm:p-10">
        <div className="flex items-start gap-4"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${valid ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40' : 'bg-destructive/10 text-destructive'}`}>{valid ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}</div><div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Entrada Vive Loja</p><h1 className="mt-1 text-2xl font-semibold text-foreground">{valid ? 'Entrada válida' : 'Entrada anulada'}</h1></div></div>
        <div className="mt-6 space-y-3 rounded-2xl bg-muted/60 p-4"><p className="flex items-center gap-2 font-semibold text-foreground"><Ticket className="h-4 w-4 text-primary" />{ticket.ticketType.name}</p><p className="text-sm text-muted-foreground">Código <span className="font-mono font-semibold text-foreground">{ticket.code}</span></p>{ticket.seatLabel && <p className="text-sm text-muted-foreground">Asiento <span className="font-semibold text-foreground">{ticket.seatLabel}</span></p>}<p className="border-t border-border/60 pt-3 text-sm font-semibold text-foreground">{ticket.event.title}</p><p className="text-sm text-muted-foreground">{new Date(ticket.event.startDate).toLocaleString('es-EC')} · {ticket.event.location}</p>{ticket.status === 'CHECKED_IN' && <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Esta entrada ya fue utilizada en la puerta.</p>}</div>
        <Button asChild className="mt-6 w-full"><Link href={`/eventos/${ticket.event.slug}`}>Ver evento</Link></Button>
      </div>
    </main>
  )
}
