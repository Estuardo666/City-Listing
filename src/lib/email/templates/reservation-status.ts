import 'server-only'
import { sendTransactionalEmail, emailLayout, BASE_URL } from '../send'

type ReservationStatus = 'CONFIRMED' | 'CANCELLED'

const STATUS_MAP: Record<ReservationStatus, { label: string; color: string }> = {
  CONFIRMED: { label: 'Confirmada', color: '#16A34A' },
  CANCELLED: { label: 'Cancelada', color: '#D97706' },
}

export async function sendReservationStatusEmail(
  to: string,
  userName: string,
  venueName: string,
  status: ReservationStatus,
  date: string,
  time: string
) {
  const { label, color } = STATUS_MAP[status]

  const html = emailLayout({
    title: `Reserva ${label.toLowerCase()}`,
    previewText: `Tu reserva en ${venueName} fue ${label.toLowerCase()}`,
    content: `
      <p style="margin:0 0 20px;">Hola ${userName}, tu reserva en <strong>${venueName}</strong> fue <span style="color:${color};font-weight:600;">${label.toLowerCase()}</span>.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAFAFA;border-radius:8px;padding:16px;margin:0 0 20px;">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#737373;">Fecha</td>
          <td align="right" style="padding:4px 0;font-size:14px;font-weight:600;color:#171717;">${date}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#737373;">Hora</td>
          <td align="right" style="padding:4px 0;font-size:14px;font-weight:600;color:#171717;">${time}</td>
        </tr>
      </table>
      ${status === 'CANCELLED' ? `<p style="margin:0;font-size:13px;color:#A3A3A3;">Podés intentar reservar en otro horario o buscar otros locales.</p>` : ''}
    `,
    ctaText: 'Ver mis reservas',
    ctaUrl: `${BASE_URL}/dashboard/reservas`,
  })

  return sendTransactionalEmail({
    to,
    subject: `Reserva ${label.toLowerCase()} — ${venueName}`,
    html,
  })
}
