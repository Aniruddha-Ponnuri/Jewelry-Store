import { createLogoutClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    if (process.env.NODE_ENV !== 'production') console.log('API logout route called')
    
    const supabase = await createLogoutClient()
    const cookieStore = await cookies()
    
    // Sign out the user on the server side
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Supabase signOut error:', error)
    } else {
      console.log('Supabase server signOut successful')
    }
    
    // Create a response that clears all auth-related cookies
    const response = NextResponse.json({ success: true })
    
    // Get all current cookies to identify Supabase auth cookies
    const allCookies = cookieStore.getAll()
    if (process.env.NODE_ENV !== 'production') console.log('Found cookies:', allCookies.map(c => c.name))
    
    // Common Supabase auth cookie patterns
    const supabaseCookiePatterns = [
      /^sb-.*-auth-token$/,
      /^supabase-auth-token$/,
      /^supabase\.auth\.token$/,
      /^sb-access-token$/,
      /^sb-refresh-token$/
    ]
    
    // Clear all Supabase auth cookies
    let clearedCookies = 0
    allCookies.forEach(cookie => {
      const isSupabaseCookie = supabaseCookiePatterns.some(pattern => 
        pattern.test(cookie.name)
      )
      
      if (isSupabaseCookie) {
        if (process.env.NODE_ENV !== 'production') console.log(`Clearing cookie: ${cookie.name}`)
        response.cookies.set(cookie.name, '', {
          maxAge: 0,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
        clearedCookies++
      }
    })
    
    // Also explicitly clear common cookie names (in case they weren't found)
    const commonCookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'supabase.auth.token'
    ]
    
    commonCookieNames.forEach(cookieName => {
      if (process.env.NODE_ENV !== 'production') console.log(`Explicitly clearing cookie: ${cookieName}`)
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })
    
    if (process.env.NODE_ENV !== 'production') console.log(`API logout completed. Cleared ${clearedCookies} auth cookies`)
    return response
  } catch (error) {
    console.error('Server logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
