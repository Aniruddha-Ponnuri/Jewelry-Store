import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withTimeout, API_TIMEOUTS } from '@/lib/timeout'

/**
 * Vercel Cron Job - Keep Supabase Connection Alive
 * 
 * This endpoint is called automatically by Vercel Cron daily
 * to ensure the Supabase database connection stays active even when
 * no users are visiting the website.
 * 
 * Schedule: Daily at midnight (00:00 UTC)
 * Cron Expression: 0 0 * * *
 * 
 * Timeout: 10 seconds max
 */

export const maxDuration = 10 // Vercel function timeout

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Always verify in production, optional in development
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (isProduction) {
      if (!cronSecret) {
        console.error('🚫 CRON_SECRET not configured')
        return NextResponse.json(
          { 
            success: false, 
            error: 'Configuration error',
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        )
      }
      
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error('🚫 Unauthorized cron attempt from:', request.headers.get('x-forwarded-for') || 'unknown')
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

    // Create Supabase client with timeout protection
    const supabase = await withTimeout(
      createClient(),
      API_TIMEOUTS.cron,
      'Create Supabase client'
    )
    
    // Perform multiple lightweight queries with timeout protection
    const checks = await withTimeout(
      Promise.allSettled([
        // Check 1: Query products count
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true }),
        
        // Check 2: Query categories count
        supabase
          .from('categories')
          .select('*', { count: 'exact', head: true }),
        
        // Check 3: Query users count (will fail for non-admin, but connection tested)
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true }),
      ]),
      API_TIMEOUTS.cron,
      'Database health checks'
    )

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

    const duration = Date.now() - startTime
    console.log(`✅ Cron keep-alive successful - All checks passed in ${duration}ms:`, new Date().toISOString())

    return NextResponse.json({
      success: true,
      message: 'Supabase connection maintained successfully',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      checks: results,
      nextRun: 'In 24 hours',
      source: 'vercel-cron'
    })

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isTimeout = errorMessage.includes('timed out')
    
    console.error('❌ Cron keep-alive error:', {
      error: errorMessage,
      duration: `${duration}ms`,
      isTimeout,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: isTimeout ? 'Timeout error' : 'Internal server error',
        message: errorMessage,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}

// Also support POST in case manual triggers are needed
export async function POST(request: NextRequest) {
  return GET(request)
}
