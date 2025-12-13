import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

const ROUTES = {
  protected: ['/bookmarks', '/profile', '/orders'],
  adminOnly: ['/admin'],
  publicOnly: ['/login', '/register', '/forgot-password'],
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const pathname = request.nextUrl.pathname

  // Skip static files and API routes
  if (pathname.includes('.') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  logger.middleware(pathname, 'Request started', {
    method: request.method
  })

  // Create response with security headers
  let response = NextResponse.next({ request })
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            })
          )
        },
      },
    }
  )

  try {
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      logger.warn('Session error in middleware', { path: pathname, error: sessionError.message })
    }

    const user = session?.user ?? null
    const userId = user?.id?.slice(0, 8)

    logger.middleware(pathname, 'Session check', {
      hasSession: !!session,
      userId: userId ? `${userId}...` : null
    })

    // Check route types
    const isPublicOnly = ROUTES.publicOnly.some(r => pathname.startsWith(r))
    const isProtected = ROUTES.protected.some(r => pathname.startsWith(r))
    const isAdminOnly = ROUTES.adminOnly.some(r => pathname.startsWith(r))

    // Redirect authenticated users from public-only routes
    if (isPublicOnly && user) {
      logger.middleware(pathname, 'Redirect: authenticated user on public route', { userId })
      logger.perf('Middleware', startTime, { path: pathname, action: 'redirect-home' })
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Redirect unauthenticated users from protected routes
    if (isProtected && !user) {
      logger.middleware(pathname, 'Redirect: unauthenticated user on protected route')
      logger.perf('Middleware', startTime, { path: pathname, action: 'redirect-login' })
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Admin routes require authentication and admin privileges
    if (isAdminOnly) {
      if (!user) {
        logger.middleware(pathname, 'Redirect: no user on admin route')
        logger.perf('Middleware', startTime, { path: pathname, action: 'admin-no-user' })
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')

      if (adminError) {
        logger.error('Admin RPC check failed', adminError)
      }

      logger.middleware(pathname, 'Admin check result', { userId, isAdmin: !!isAdmin })

      if (!isAdmin) {
        logger.middleware(pathname, 'Redirect: non-admin denied', { userId })
        logger.perf('Middleware', startTime, { path: pathname, action: 'admin-denied' })
        return NextResponse.redirect(new URL('/', request.url))
      }

      logger.middleware(pathname, 'Admin access granted', { userId })
    }

    logger.perf('Middleware', startTime, { path: pathname, action: 'pass' })
    return response

  } catch (error) {
    logger.error('Middleware exception', error)
    logger.perf('Middleware', startTime, { path: pathname, action: 'error' })
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api).*)'],
}
