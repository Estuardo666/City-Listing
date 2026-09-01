import 'server-only'
import { Resend } from "resend";

// Do not instantiate the SDK during module evaluation when the optional
// integration is not configured. Next.js evaluates API route modules while
// collecting build metadata, and Resend throws if it receives `undefined`.
// Keeping the failure at call time lets the app build while still failing
// closed for email delivery until the hosting environment is configured.
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const EMAIL_FROM = "Vive Loja <notifications@viveloja.com>";

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}) {
  if (!resend) {
    throw new Error('RESEND_API_KEY no configurada');
  }

  return resend.emails.send({
    from: EMAIL_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html: html ?? "",
    text: text ?? "",
  } as Parameters<typeof resend.emails.send>[0]);
}

export { resend };
