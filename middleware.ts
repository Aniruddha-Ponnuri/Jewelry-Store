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
      console.error('Middleware session error:', error)
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
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Check if user is admin with enhanced error handling
      try {
        const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin')
        
        if (adminError) {
          console.error('Middleware: Error checking admin status:', adminError)
          // For admin routes, be more strict with errors
          if (adminError.message?.includes('permission') || adminError.message?.includes('not authenticated')) {
            console.log('Middleware: Authentication error, redirecting to login')
            return NextResponse.redirect(new URL('/login', request.url))
          }
          // For other errors, let the app handle it
        } else if (!isAdminData) {
          console.log('Middleware: User is not admin, redirecting to home')
          return NextResponse.redirect(new URL('/', request.url))
        } else {
          console.log('Middleware: Admin access confirmed')
        }
      } catch (error) {
        console.error('Middleware: Error in admin check:', error)
        // Don't block access on unexpected errors - let the app handle it
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
