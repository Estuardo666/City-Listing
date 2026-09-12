import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarDays, CheckCircle2, ExternalLink, MapPin, Ticket as TicketIcon } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMyTicketOrders } from '@/lib/ticketing'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mis Entradas — Vive Loja',
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency }).format(cents / 100)
}

function statusLabel(status: string) {
  switch (status) {
    case 'REFUNDED': return 'Devuelta'
    case 'REFUND_PENDING': return 'Reembolso en proceso'
    default: return 'Confirmada'
  }
}

function statusClass(status: string) {
  switch (status) {
    case 'REFUNDED': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
    case 'REFUND_PENDING': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
    default: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
  }
}

export default async function DashboardTicketsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const orders = await getMyTicketOrders(session.user.id)

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tu cuenta</p>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground sm:text-3xl">
            <TicketIcon className="h-7 w-7 text-primary" />
            Mis entradas
          </h1>
          <p className="text-sm text-muted-foreground">Consulta tus compras confirmadas y presenta el QR de cada entrada al ingresar.</p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card px-6 py-16 text-center shadow-sm">
            <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground/60" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Aún no tienes entradas</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Tus compras confirmadas aparecerán aquí cuando uses esta misma cuenta durante la compra.</p>
            <Button asChild className="mt-6"><Link href="/eventos">Explorar eventos</Link></Button>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article key={order.id} className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
                <div className="border-b border-border/60 bg-muted/35 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(order.status)}`}>{statusLabel(order.status)}</span>
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{order.event.title}</h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{order.event.startDate.toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Guayaquil' })}</span>
                        <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{order.event.location}</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-semibold text-foreground">{money(order.totalCents, order.currency)}</p>
                      <p className="text-xs text-muted-foreground">{order.tickets.length} {order.tickets.length === 1 ? 'entrada' : 'entradas'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  {order.tickets.length === 0 ? (
                    <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Tus entradas están siendo generadas. Vuelve a cargar en unos segundos.</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {order.tickets.map((ticket, index) => (
                        <div key={ticket.id} className="flex flex-col gap-4 rounded-2xl border border-border/60 p-4 sm:flex-row sm:items-center">
                          <img src={ticket.qrImageUrl} alt={`Código QR de la entrada ${index + 1}`} className="h-36 w-36 self-center rounded-xl border border-border bg-white p-2 sm:self-auto" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">{ticket.ticketType.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Entrada {index + 1} de {order.tickets.length}</p>
                            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{ticket.code}</p>
                            {ticket.seatLabel && <p className="mt-1 text-sm text-muted-foreground">Asiento: {ticket.seatLabel}</p>}
                            <a href={ticket.qrData} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                              Abrir entrada <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
                    <Button asChild><Link href={`/eventos/${order.event.slug}`}>Ver evento</Link></Button>
                    <Button asChild variant="outline"><Link href="/dashboard/entradas">Actualizar</Link></Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
