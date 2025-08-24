import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // Get session and refresh if needed
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      // Handle specific refresh token errors in middleware
      if (error.message.includes('refresh_token_not_found') || 
          error.message.includes('Invalid Refresh Token') ||
          error.message.includes('Refresh Token Not Found')) {
        console.warn('Middleware: Refresh token error detected, clearing session')
        // Don't redirect to login, just continue without authentication
        return supabaseResponse
      } else {
        console.error('Middleware session error:', error.message)
      }
    }

    let currentUser = session?.user

    // If no user but we have a session, try refreshing
    if (!currentUser && session) {
      console.log('Middleware: Attempting to refresh session...')
      const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession()
      if (!refreshError && refreshResult.session) {
        currentUser = refreshResult.session.user
        console.log('Middleware: Session refreshed successfully')
      }
    }

    // Final fallback: try getUser
    if (!currentUser) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!userError && user) {
        currentUser = user
        console.log('Middleware: Got user from getUser')
      }
    }

    // Protect admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!currentUser) {
        console.log('Middleware: No user for admin route, redirecting to login')
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Check if user is admin with enhanced error handling and retries
      try {
        let isAdminData = null
        let adminError = null
        
        // Try admin check with retries
        for (let attempt = 0; attempt < 2; attempt++) {
          const { data, error } = await supabase.rpc('is_admin')
          isAdminData = data
          adminError = error
          
          if (!error) {
            break
          }
          
          if (attempt < 1) {
            console.log('Middleware: Admin check failed, retrying...')
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
        
        if (adminError) {
          console.error('Middleware: Error checking admin status:', adminError)
          // For admin routes, be more strict with errors
          if (adminError.message?.includes('permission') || 
              adminError.message?.includes('not authenticated') ||
              adminError.message?.includes('JWT') ||
              adminError.message?.includes('session')) {
            console.log('Middleware: Authentication error, redirecting to login')
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
            return NextResponse.redirect(loginUrl)
          }
          // For other errors, allow access but log warning
          console.warn('Middleware: Non-critical admin check error, allowing access')
        } else if (!isAdminData) {
          console.log('Middleware: User is not admin, redirecting to home')
          return NextResponse.redirect(new URL('/', request.url))
        } else {
          console.log('Middleware: Admin access confirmed for user:', currentUser.email)
        }
      } catch (error) {
        console.error('Middleware: Error in admin check:', error)
        // For unexpected errors, redirect to login to be safe
        console.log('Middleware: Unexpected error, redirecting to login for safety')
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    // Protect bookmarks route
    if (request.nextUrl.pathname.startsWith('/bookmarks')) {
      if (!currentUser) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
    
    // Redirect authenticated users away from auth pages
    if (currentUser && (
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/register') ||
      request.nextUrl.pathname.startsWith('/forgot-password')
    )) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Allow access to reset-password page regardless of auth status
    if (request.nextUrl.pathname.startsWith('/reset-password')) {
      return supabaseResponse
    }

  } catch (error) {
    console.error('Middleware error:', error)
    // Continue processing even if there's an error
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
