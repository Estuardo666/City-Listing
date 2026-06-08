import 'server-only'
import { sendEmail } from '@/lib/resend'
import { emailLayout } from './layout'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://viveloja.com'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendTransactionalEmail(params: SendEmailParams) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📧 [DEV] Email → ${params.to}: ${params.subject}`)
    }
    await sendEmail({ to: params.to, subject: params.subject, html: params.html })
    return { success: true }
  } catch (error) {
    console.error('📧 Error sending email:', error)
    return { success: false, error }
  }
}

export { emailLayout, BASE_URL }
