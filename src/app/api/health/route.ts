import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

/**
 * Enhanced health check endpoint for monitoring
 * Returns the status of critical services and configuration
 */
export async function GET() {
  const timestamp = new Date().toISOString()
  
  try {
    const checks = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasSiteUrl: !!env.NEXT_PUBLIC_SITE_URL,
        hasCronSecret: !!process.env.CRON_SECRET,
      },
      services: {
        supabase: env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        authentication: 'operational',
      },
      timestamp,
    }

    const allHealthy = 
      checks.environment.hasSupabaseUrl &&
      checks.environment.hasSupabaseKey &&
      checks.environment.hasSiteUrl

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      ...checks,
    }, {
      status: allHealthy ? 200 : 503,
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp,
    }, {
      status: 500,
    })
  }
}

