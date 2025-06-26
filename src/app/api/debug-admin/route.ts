import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (options) {
                request.cookies.set({ name, value, ...options })
              }
            })
          },
        },
      }
    )

    const debug: Record<string, any> = {
      timestamp: new Date().toISOString(),
      server: 'Vercel',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    debug.auth = {
      user: user ? {
        id: user.id,
        email: user.email,
        confirmed_at: user.email_confirmed_at,
        created_at: user.created_at
      } : null,
      error: userError?.message || null
    }

    if (user) {
      // Check admin_users table
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)

      debug.adminUsersTable = {
        data: adminUsers,
        error: adminError?.message || null
      }

      // Test is_admin function
      const { data: isAdminResult, error: isAdminError } = await supabase.rpc('is_admin')
      
      debug.isAdminFunction = {
        result: isAdminResult,
        error: isAdminError?.message || null
      }

      // Explicit test with UUID
      const { data: explicitResult, error: explicitError } = await supabase.rpc('is_admin', {
        user_uuid: user.id
      })
      
      debug.explicitCheck = {
        result: explicitResult,
        error: explicitError?.message || null
      }
    }

    // Test database connection
    const { data: dbTest, error: dbError } = await supabase
      .from('admin_users')
      .select('count(*)')

    debug.dbConnection = {
      data: dbTest,
      error: dbError?.message || null
    }

    return NextResponse.json(debug, { status: 200 })

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
