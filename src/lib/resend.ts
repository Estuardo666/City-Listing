import 'server-only'
import { Resend } from "resend";

// Do not instantiate the SDK during module evaluation when the optional
// integration is not configured. Next.js evaluates API route modules while
// collecting build metadata, and Resend throws if it receives `undefined`.
// Keeping the failure at call time lets the app build while still failing
// closed for email delivery until the hosting environment is configured.
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Keep the sender configurable so production can use the exact domain verified
// in Resend. The fallback preserves local development and existing deployments.
export const EMAIL_FROM = process.env.EMAIL_FROM?.trim() || "Vive Loja <notifications@viveloja.com>";

type ResendEmailResponse = {
  error?: { name?: string; message?: string; statusCode?: number | null } | null;
  data?: { id?: string } | null;
};

export function assertResendAccepted(response: ResendEmailResponse) {
  if (response.error) {
    const detail = [response.error.name, response.error.statusCode, response.error.message].filter(Boolean).join(': ');
    throw new Error(`Resend rechazó el correo${detail ? ` (${detail})` : ''}`);
  }
  if (!response.data?.id) {
    throw new Error('Resend no devolvió un ID de correo');
  }
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  idempotencyKey,
}: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  idempotencyKey?: string;
}) {
  if (!resend) {
    throw new Error('RESEND_API_KEY no configurada');
  }

  const response = await resend.emails.send({
    from: EMAIL_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html: html ?? "",
    text: text ?? "",
  } as Parameters<typeof resend.emails.send>[0], idempotencyKey ? { idempotencyKey } : undefined);

  // Resend returns provider errors in the response instead of throwing. Do
  // not acknowledge the outbox row until the provider returned an email ID.
  assertResendAccepted(response);

  return response;
}

export { resend };
