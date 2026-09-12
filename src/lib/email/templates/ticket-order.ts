import { sendTransactionalEmail, emailLayout, BASE_URL } from '../send'

type TicketEmail = { code: string; name: string; seatLabel: string | null; qrData: string }
type TicketOrderEmailInput = { to: string; buyerName: string; eventTitle: string; eventSlug: string; startDate: Date; location: string; tickets: TicketEmail[]; clientTransactionId: string }

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
}

export async function sendTicketOrderEmail(input: TicketOrderEmailInput) {
  const ticketRows = input.tickets.map((ticket) => `<li style="margin:0 0 14px;padding:12px;border:1px solid #E5E5E5;border-radius:8px;"><strong>${escapeHtml(ticket.name)}</strong>${ticket.seatLabel ? ` · ${escapeHtml(ticket.seatLabel)}` : ''}<br/><span style="font-size:13px;color:#525252;">Código: ${escapeHtml(ticket.code)}</span><br/><a href="${escapeHtml(ticket.qrData)}" target="_blank" style="color:#171717;">Abrir entrada y QR</a></li>`).join('')
  const content = `<p>Hola ${escapeHtml(input.buyerName)},</p><p>Tu compra para <strong>${escapeHtml(input.eventTitle)}</strong> fue confirmada.</p><p><strong>Cuándo:</strong> ${input.startDate.toLocaleString('es-EC', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Guayaquil' })}<br/><strong>Dónde:</strong> ${escapeHtml(input.location)}</p><ul style="padding-left:18px;">${ticketRows}</ul><p>Guarda este correo y presenta el QR de cada entrada al ingresar.</p>`
  return sendTransactionalEmail({ to: input.to, subject: `Entradas confirmadas · ${input.eventTitle}`, idempotencyKey: `tickets:${input.clientTransactionId}:buyer`, html: emailLayout({ title: 'Compra confirmada', previewText: `Tus entradas para ${input.eventTitle}`, content, ctaText: 'Ver el evento', ctaUrl: `${BASE_URL}/eventos/${encodeURIComponent(input.eventSlug)}` }) })
}

export async function sendTicketOrderAdminEmail(input: TicketOrderEmailInput & { recipientName: string; buyerEmail: string; buyerPhone: string; totalCents: number }) {
  const ticketRows = input.tickets.map((ticket) => `<li style="margin:0 0 8px;"><strong>${escapeHtml(ticket.name)}</strong>${ticket.seatLabel ? ` · ${escapeHtml(ticket.seatLabel)}` : ''}<br/><span style="font-size:13px;color:#525252;">${escapeHtml(ticket.code)}</span></li>`).join('')
  const amount = `$${(input.totalCents / 100).toFixed(2)}`
  const content = `<p>Hola ${escapeHtml(input.recipientName)},</p><p>Se confirmó una nueva venta para <strong>${escapeHtml(input.eventTitle)}</strong>.</p><div style="background:#F5F5F5;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:0 0 8px;"><strong>Comprador:</strong> ${escapeHtml(input.buyerName)}</p><p style="margin:0 0 8px;"><strong>Correo:</strong> ${escapeHtml(input.buyerEmail)}</p><p style="margin:0 0 8px;"><strong>Teléfono:</strong> ${escapeHtml(input.buyerPhone)}</p><p style="margin:0 0 8px;"><strong>Entradas:</strong> ${input.tickets.length}</p><p style="margin:0;"><strong>Total:</strong> ${amount}</p></div><p><strong>Cuándo:</strong> ${input.startDate.toLocaleString('es-EC', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Guayaquil' })}<br/><strong>Dónde:</strong> ${escapeHtml(input.location)}</p><ul style="padding-left:18px;">${ticketRows}</ul><p style="font-size:13px;color:#525252;">Referencia: ${escapeHtml(input.clientTransactionId)}</p>`
  return sendTransactionalEmail({ to: input.to, subject: `Nueva venta · ${input.eventTitle}`, idempotencyKey: `tickets:${input.clientTransactionId}:admin:${encodeURIComponent(input.to.toLowerCase())}`, html: emailLayout({ title: 'Nueva venta confirmada', previewText: `${input.tickets.length} entrada(s) vendida(s)`, content, ctaText: 'Ver ventas del evento', ctaUrl: `${BASE_URL}/dashboard/eventos/${encodeURIComponent(input.eventSlug)}/editar`, ctaColor: '#2563EB' }) })
}
