import { NextRequest } from 'next/server'
import { GET as searchGET } from '@/app/api/explore/search/route'
import { mobileSuccess } from '@/lib/mobile-response'

export async function GET(request: NextRequest) {
  const response = await searchGET(request)
  const payload = await response.json()
  if (!response.ok) return response
  return mobileSuccess(payload)
}
