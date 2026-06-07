import { sendTransactionalEmail, emailLayout, BASE_URL } from '../send'

export async function sendReservationConfirmationEmail(
  to: string,
  userName: string,
  venueName: string,
  date: string,
  time: string,
  partySize: number
) {
  const html = emailLayout({
    title: 'Reserva recibida',
    previewText: `Tu reserva en ${venueName} fue registrada`,
    content: `
      <p style="margin:0 0 20px;">Hola ${userName}, tu reserva fue registrada correctamente.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAFAFA;border-radius:8px;padding:16px;margin:0 0 20px;">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#737373;">Local</td>
          <td align="right" style="padding:4px 0;font-size:14px;font-weight:600;color:#171717;">${venueName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#737373;">Fecha</td>
          <td align="right" style="padding:4px 0;font-size:14px;font-weight:600;color:#171717;">${date}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#737373;">Hora</td>
          <td align="right" style="padding:4px 0;font-size:14px;font-weight:600;color:#171717;">${time}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#737373;">Personas</td>
          <td align="right" style="padding:4px 0;font-size:14px;font-weight:600;color:#171717;">${partySize}</td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;color:#A3A3A3;">Te notificaremos cuando el local confirme tu reserva.</p>
    `,
    ctaText: 'Ver mis reservas',
    ctaUrl: `${BASE_URL}/dashboard/reservas`,
  })

  return sendTransactionalEmail({
    to,
    subject: `Reserva en ${venueName}`,
    html,
  })
}
