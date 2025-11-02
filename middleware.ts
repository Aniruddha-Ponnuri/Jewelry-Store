import { enhancedAuthMiddleware, createMiddlewareConfig } from '@/lib/auth/middleware'
import { type NextRequest } from 'next/server'

const isProduction = process.env.NODE_ENV === 'production'

// Configure enhanced middleware with your specific settings
const middlewareConfig = createMiddlewareConfig()
  .withRoutes({
    protected: ['/bookmarks', '/profile'],
    adminOnly: ['/admin'],
    publicOnly: ['/login', '/register', '/forgot-password'],
    apiRoutes: ['/api']
  })
  .withRedirects({
    login: '/login',
    logout: '/',
    unauthorized: '/',
    maintenance: '/maintenance'
  })
  .withSecurity({
    rateLimiting: {
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
    },
    session: {
      maxAge: 24 * 60 * 60, // 24 hours
      refreshThreshold: 15 * 60, // 15 minutes
      cookieOptions: {
        httpOnly: true,
        secure: true, // Always use secure cookies
        sameSite: 'lax',
      },
    },
    logging: {
      level: isProduction ? 'minimal' : 'standard',
      includeIPs: !isProduction,
      includeSensitiveData: false,
    },
  })
  .build()

export async function middleware(request: NextRequest) {
  return await enhancedAuthMiddleware(request, middlewareConfig)
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
