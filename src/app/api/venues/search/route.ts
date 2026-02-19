import { NextRequest, NextResponse } from 'next/server'
import { getVenues } from '@/lib/queries/venues'
import { venueListFiltersSchema } from '@/schemas/venue.schema'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const parsedFilters = venueListFiltersSchema.parse({
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      featured: searchParams.get('featured') || 'all',
      status: 'APPROVED',
    })

    const venues = await getVenues(parsedFilters)

    return NextResponse.json({ venues })
  } catch (error) {
    console.error('Error in venues search API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
