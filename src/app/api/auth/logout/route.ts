import { createLogoutClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function POST() {
  const startTime = Date.now()

  try {
    logger.api('POST', '/api/auth/logout', {})

    const supabase = await createLogoutClient()
    const cookieStore = await cookies()

    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.warn('Supabase signOut error', { error: error.message })
    } else {
      logger.auth('Supabase signOut successful')
    }

    const response = NextResponse.json({ success: true })

    // Clear Supabase auth cookies
    const allCookies = cookieStore.getAll()
    const supabaseCookiePatterns = [
      /^sb-.*-auth-token$/,
      /^supabase-auth-token$/,
      /^supabase\.auth\.token$/,
      /^sb-access-token$/,
      /^sb-refresh-token$/
    ]

    let clearedCount = 0
    allCookies.forEach(cookie => {
      if (supabaseCookiePatterns.some(p => p.test(cookie.name))) {
        response.cookies.set(cookie.name, '', {
          maxAge: 0,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
        clearedCount++
      }
    })

    // Clear common cookie names explicitly
    const commonCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token']
    commonCookies.forEach(name => {
      response.cookies.set(name, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })

    logger.auth('Logout completed', { clearedCookies: clearedCount })
    logger.perf('Logout API', startTime, { success: true })

    return response

  } catch (error) {
    logger.error('Logout API exception', error)
    logger.perf('Logout API', startTime, { success: false })
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
