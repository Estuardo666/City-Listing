import { NextRequest, NextResponse } from 'next/server'
import { searchDocuments } from '@/lib/search'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || 'restaurantes'
  
  console.log('🔍 Testing Upstash Search with query:', query)
  
  try {
    const startTime = Date.now()
    const results = await searchDocuments(query, 10)
    const endTime = Date.now()
    
    console.log(`📊 Search took ${endTime - startTime}ms`)
    console.log(`📊 Found ${results.length} results`)
    console.log('📊 First result:', results[0])
    
    return NextResponse.json({
      success: true,
      query,
      timeMs: endTime - startTime,
      resultCount: results.length,
      results: results.slice(0, 3), // Solo mostrar primeros 3
      message: results.length > 0 
        ? '✅ Upstash Search is working!' 
        : '❌ No results found - might be using PostgreSQL fallback'
    })
  } catch (error) {
    console.error('❌ Search test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '❌ Upstash Search failed - check configuration'
    }, { status: 500 })
  }
}
