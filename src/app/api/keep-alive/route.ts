import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Create Supabase client
    const supabase = await createClient()
    
    // Perform a lightweight database operation to keep connection alive
    // Use a simple count query on products table
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Keep-alive ping failed:', error.message)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database ping failed',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Log successful ping (minimal logging to avoid interference)
    // Only log if explicitly needed - removed to prevent console clutter

    return NextResponse.json({
      success: true,
      message: 'Database connection is alive',
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
      productCount: count || 0
    })

  } catch (error) {
    console.error('Keep-alive endpoint error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, source = 'client' } = body

    const supabase = await createClient()
    
    // Perform a simple query to test database connectivity
    // Use a lightweight count query instead of querying system tables
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Keep-alive POST ping failed:', error.message)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database ping failed',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Log ping with client info (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Keep-alive ping from ${source}:`, clientId || 'unknown', new Date().toISOString())
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection maintained',
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
      clientId,
      source,
      productCount: count || 0
    })

  } catch (error) {
    console.error('Keep-alive POST error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
