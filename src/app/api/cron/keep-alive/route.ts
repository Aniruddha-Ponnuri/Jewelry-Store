import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Vercel Cron Job - Keep Supabase Connection Alive
 * 
 * This endpoint is called automatically by Vercel Cron daily
 * to ensure the Supabase database connection stays active even when
 * no users are visiting the website.
 * 
 * Schedule: Daily at midnight UTC (00:00)
 * Cron Expression: 0 0 * * *
 */

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Only verify in production to prevent cron job abuse
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error('🚫 Unauthorized cron attempt')
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unauthorized',
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        )
      }
    }

    console.log('🔄 Cron keep-alive job started:', new Date().toISOString())

    // Create Supabase client
    const supabase = await createClient()
    
    // Perform multiple lightweight queries to ensure connection health
    const checks = await Promise.allSettled([
      // Check 1: Query schema information
      supabase
        .from('information_schema.schemata')
        .select('schema_name')
        .limit(1),
      
      // Check 2: Query tables information
      supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1),
    ])

    const results = checks.map((result, index) => ({
      check: index + 1,
      status: result.status,
      success: result.status === 'fulfilled' && !result.value.error,
      error: result.status === 'rejected' 
        ? String(result.reason)
        : result.status === 'fulfilled' && result.value.error
        ? result.value.error.message
        : null
    }))

    const allSuccessful = results.every(r => r.success)
    
    if (!allSuccessful) {
      console.error('❌ Cron keep-alive checks failed:', results)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Some database checks failed',
          checks: results,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    console.log('✅ Cron keep-alive successful - All checks passed:', new Date().toISOString())

    return NextResponse.json({
      success: true,
      message: 'Supabase connection maintained successfully',
      timestamp: new Date().toISOString(),
      checks: results,
      nextRun: 'In 24 hours',
      source: 'vercel-cron'
    })

  } catch (error) {
    console.error('❌ Cron keep-alive error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Also support POST in case manual triggers are needed
export async function POST(request: NextRequest) {
  return GET(request)
}
