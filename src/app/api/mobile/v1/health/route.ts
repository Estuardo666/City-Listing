import { mobileSuccess } from '@/lib/mobile-response'

export async function GET() {
  return mobileSuccess({ status: 'ok', service: 'vive-loja-api', version: 'v1' })
}
