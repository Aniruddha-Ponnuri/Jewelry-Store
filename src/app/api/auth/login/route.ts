import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { email, password } = await request.json()

    logger.api('POST', '/api/auth/login', { email: email?.slice(0, 3) + '***' })

    if (!email || !password) {
      logger.warn('Login attempt with missing credentials')
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logger.auth('Login failed', {
        email: email?.slice(0, 3) + '***',
        error: error.message,
        code: error.status
      })
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    logger.auth('Login successful', {
      userId: data.user?.id?.slice(0, 8) + '...',
      hasSession: !!data.session,
      expiresAt: data.session?.expires_at
    })

    logger.perf('Login API', startTime, { success: true })

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    })

  } catch (error) {
    logger.error('Login API exception', error)
    logger.perf('Login API', startTime, { success: false })
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
