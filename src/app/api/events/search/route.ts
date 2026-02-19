import { NextRequest, NextResponse } from 'next/server'
import { getEvents } from '@/lib/queries/events'
import { eventListFiltersSchema } from '@/schemas/event.schema'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const parsedFilters = eventListFiltersSchema.parse({
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      featured: searchParams.get('featured') || 'all',
      status: 'APPROVED',
    })

    const events = await getEvents(parsedFilters)

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error in events search API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
