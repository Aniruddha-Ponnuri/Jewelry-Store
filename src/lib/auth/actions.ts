'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { 
  inputValidator, 
  rateLimiter, 
  secureLogger,
  csrfProtection 
} from './security'

// Response types
export interface AuthResult {
  success: boolean
  error?: string
  data?: {
    user?: {
      id: string
      email: string
      emailConfirmed?: boolean
    }
    requiresVerification?: boolean
    redirectTo?: string
    message?: string
  }
  metadata?: {
    rateLimited?: boolean
    remainingAttempts?: number
  }
}

interface LoginData {
  email: string
  password: string
  remember?: boolean
  redirectTo?: string
}

interface RegisterData {
  email: string
  password: string
  fullName?: string
  terms: boolean
}

/**
 * Get client identification for rate limiting
 */
async function getClientIdentifier(): Promise<string> {
  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  const real = headersList.get('x-real-ip')
  
  let clientIP = 'unknown'
  if (forwarded) {
    clientIP = forwarded.split(',')[0].trim()
  } else if (real) {
    clientIP = real
  }
  
  return `ip:${clientIP}`
}

/**
 * Enhanced login action with comprehensive security
 */
export async function secureLogin(
  prevState: AuthResult | undefined,
  formData: FormData
): Promise<AuthResult> {
  const startTime = Date.now()
  
  try {
    // Extract and validate input
    const email = formData.get('email')?.toString()
    const password = formData.get('password')?.toString()
    const remember = formData.get('remember') === 'true'
    const redirectTo = formData.get('redirectTo')?.toString() || '/'
    const csrfToken = formData.get('csrf_token')?.toString()

    // Input validation
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      }
    }

    // Validate email format
    const emailValidation = inputValidator.validateEmail(email)
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: 'Please enter a valid email address'
      }
    }

    // Validate password
    const passwordValidation = inputValidator.validatePassword(password)
    if (!passwordValidation.isValid) {
      let errorMessage = 'Password does not meet requirements'
      
      switch (passwordValidation.reason) {
        case 'too_short':
          errorMessage = 'Password must be at least 8 characters long'
          break
        case 'weak_password':
          errorMessage = 'Password is too weak. Please use a mix of uppercase, lowercase, numbers, and symbols'
          break
        case 'common_password':
          errorMessage = 'This password is too common. Please choose a more unique password'
          break
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }

    // Rate limiting check
    const clientId = await getClientIdentifier()
    if (!rateLimiter.checkLimit(clientId)) {
      const hdrs = await headers()
      const forwarded = hdrs.get('x-forwarded-for')
      const real = hdrs.get('x-real-ip')
      const ua = hdrs.get('user-agent') || 'unknown'
      const ip = forwarded ? forwarded.split(',')[0].trim() : (real || 'unknown')
      secureLogger.security(
        {
          type: 'RATE_LIMIT',
          ip,
          userAgent: ua,
          details: {
            email: inputValidator.sanitizeInput(email),
            clientId,
            action: 'login'
          }
        }
      )
      
      return {
        success: false,
        error: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
        metadata: {
          rateLimited: true,
          remainingAttempts: 0
        }
      }
    }

    // CSRF validation
    if (csrfToken) {
      const isValidCSRF = await csrfProtection.validateToken(csrfToken)
      if (!isValidCSRF) {
        const hdrs = await headers()
        const forwarded = hdrs.get('x-forwarded-for')
        const real = hdrs.get('x-real-ip')
        const ua = hdrs.get('user-agent') || 'unknown'
        const ip = forwarded ? forwarded.split(',')[0].trim() : (real || 'unknown')
        secureLogger.security(
          {
            type: 'CSRF_VIOLATION',
            ip,
            userAgent: ua,
            details: {
              email: inputValidator.sanitizeInput(email),
              action: 'login'
            }
          }
        )
        
        return {
          success: false,
          error: 'Security validation failed. Please refresh the page and try again.'
        }
      }
    }

    // Sanitize inputs
    const sanitizedEmail = String(inputValidator.sanitizeInput(email)).toLowerCase()
    
    // Create Supabase client
    const supabase = await createClient()
    
    secureLogger.info('Login attempt', {
      email: sanitizedEmail,
      hasRemember: remember,
      redirectTo: inputValidator.sanitizeInput(redirectTo)
    })

    // Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    })

    // Record attempt for rate limiting
    rateLimiter.recordAttempt(clientId, !error, sanitizedEmail)

    if (error) {
      secureLogger.warn('Login failed', {
        email: sanitizedEmail,
        error: error.message,
        errorCode: error.status
      })

      // Provide generic error message for security
      let userMessage = 'Invalid email or password'
      
      // Handle specific error cases
      if (error.message.includes('Email not confirmed')) {
        userMessage = 'Please check your email and click the verification link before signing in'
      } else if (error.message.includes('Invalid login credentials')) {
        userMessage = 'Invalid email or password'
      } else if (error.message.includes('Too many requests')) {
        userMessage = 'Too many login attempts. Please wait a moment before trying again'
      }

      return {
        success: false,
        error: userMessage,
        metadata: {
          remainingAttempts: Math.max(0, 5 - (await countRecentFailures()))
        }
      }
    }

    if (!data.session || !data.user) {
      secureLogger.error('Login succeeded but no session created', {
        email: sanitizedEmail,
        hasUser: !!data.user,
        hasSession: !!data.session
      })
      
      return {
        success: false,
        error: 'Failed to create session. Please try again.'
      }
    }

    // Success logging
    secureLogger.info('Login successful', {
      userId: data.user.id,
      email: sanitizedEmail,
      sessionDuration: Date.now() - startTime
    })

    // Reset rate limiting on success
    rateLimiter.reset(clientId)

    // Set secure session cookie options
    const cookieStore = await cookies()
    const sessionCookies = cookieStore.getAll().filter(cookie => 
      cookie.name.startsWith('sb-') || cookie.name.includes('supabase')
    )

    // Enhance session cookie security
    sessionCookies.forEach(cookie => {
      cookieStore.set(cookie.name, cookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days if remember, otherwise 24 hours
        path: '/'
      })
    })

    // Revalidate auth-dependent pages
    revalidatePath('/', 'layout')

    // Check if redirect is safe
    const safeRedirectTo = validateRedirectUrl(redirectTo)
    
    return {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: !!data.user.email_confirmed_at
        },
        redirectTo: safeRedirectTo
      }
    }

  } catch (error) {
    secureLogger.error('Login action error', error)
    
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Enhanced registration action with security features
 */
export async function secureRegister(
  prevState: AuthResult | undefined,
  formData: FormData
): Promise<AuthResult> {
  try {
    // Extract and validate input
    const email = formData.get('email')?.toString()
    const password = formData.get('password')?.toString()
    const fullName = formData.get('fullName')?.toString()
    const terms = formData.get('terms') === 'true'
    const csrfToken = formData.get('csrf_token')?.toString()

    // Input validation
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      }
    }

    if (!terms) {
      return {
        success: false,
        error: 'You must agree to the terms and conditions'
      }
    }

    // Validate email
    const emailValidation = inputValidator.validateEmail(email)
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: 'Please enter a valid email address'
      }
    }

    // Validate password strength
    const passwordValidation = inputValidator.validatePassword(password)
    if (!passwordValidation.isValid) {
      let errorMessage = 'Password does not meet security requirements'
      
      switch (passwordValidation.reason) {
        case 'too_short':
          errorMessage = 'Password must be at least 8 characters long'
          break
        case 'weak_password':
          errorMessage = 'Password must include uppercase, lowercase, numbers, and special characters'
          break
        case 'common_password':
          errorMessage = 'This password is too common. Please choose a more secure password'
          break
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }

    // Rate limiting
    const clientId = await getClientIdentifier()
    if (!rateLimiter.checkLimit(clientId)) {
      return {
        success: false,
        error: 'Too many registration attempts. Please wait before trying again.'
      }
    }

    // CSRF validation
    if (csrfToken) {
      const isValidCSRF = await csrfProtection.validateToken(csrfToken)
      if (!isValidCSRF) {
        return {
          success: false,
          error: 'Security validation failed. Please refresh the page and try again.'
        }
      }
    }

    // Sanitize inputs
    const sanitizedEmail = inputValidator.sanitizeInput(email).toLowerCase()
    const sanitizedFullName = fullName ? inputValidator.sanitizeInput(fullName) : undefined

    const supabase = await createClient()

    secureLogger.info('Registration attempt', {
      email: sanitizedEmail,
      hasFullName: !!sanitizedFullName
    })

    // Attempt registration
    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: {
          full_name: sanitizedFullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })

    // Record attempt
    rateLimiter.recordAttempt(clientId, !error, sanitizedEmail)

    if (error) {
      secureLogger.warn('Registration failed', {
        email: sanitizedEmail,
        error: error.message
      })

      let userMessage = 'Registration failed. Please try again.'
      
      if (error.message.includes('already registered')) {
        userMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (error.message.includes('Password')) {
        userMessage = 'Password does not meet requirements'
      }

      return {
        success: false,
        error: userMessage
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      }
    }

    secureLogger.info('Registration successful', {
      userId: data.user.id,
      email: sanitizedEmail,
      requiresConfirmation: !data.session
    })

    // Reset rate limiting on success
    rateLimiter.reset(clientId)

    return {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email
        },
        requiresVerification: !data.session
      }
    }

  } catch (error) {
    secureLogger.error('Registration action error', error)
    
    return {
      success: false,
      error: 'An unexpected error occurred during registration.'
    }
  }
}

/**
 * Secure logout action
 */
export async function secureLogout(): Promise<void> {
  try {
    secureLogger.info('Logout initiated')

    const supabase = await createClient()
    
    // Clear session
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      secureLogger.error('Logout error', error)
    } else {
      secureLogger.info('Logout successful')
    }

    // Clear cookies manually for extra security
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const supabaseCookiePatterns = [
      /^sb-.*-auth-token$/,
      /^supabase-auth-token$/,
      /^supabase\.auth\.token$/,
      /^sb-access-token$/,
      /^sb-refresh-token$/
    ]

    allCookies.forEach(cookie => {
      const isSupabaseCookie = supabaseCookiePatterns.some(pattern => 
        pattern.test(cookie.name)
      )

      if (isSupabaseCookie) {
        cookieStore.set(cookie.name, '', {
          maxAge: 0,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
      }
    })

    // Revalidate all pages
    revalidatePath('/', 'layout')

  } catch (error) {
    secureLogger.error('Logout action error', error)
  }

  // Always redirect to home
  redirect('/')
}

/**
 * Password reset request with security
 */
export async function securePasswordReset(
  prevState: AuthResult | undefined,
  formData: FormData
): Promise<AuthResult> {
  try {
    const email = formData.get('email')?.toString()
    const csrfToken = formData.get('csrf_token')?.toString()

    if (!email) {
      return {
        success: false,
        error: 'Email address is required'
      }
    }

    // Validate email
    const emailValidation = inputValidator.validateEmail(email)
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: 'Please enter a valid email address'
      }
    }

    // Rate limiting
    const clientId = await getClientIdentifier()
    if (!rateLimiter.checkLimit(clientId)) {
      return {
        success: false,
        error: 'Too many password reset requests. Please wait before trying again.'
      }
    }

    // CSRF validation
    if (csrfToken) {
      const isValidCSRF = await csrfProtection.validateToken(csrfToken)
      if (!isValidCSRF) {
        return {
          success: false,
          error: 'Security validation failed. Please refresh the page and try again.'
        }
      }
    }

    const sanitizedEmail = inputValidator.sanitizeInput(email).toLowerCase()
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
    })

    // Record attempt
    rateLimiter.recordAttempt(clientId, !error, sanitizedEmail)

    // Always return success for security (don't reveal if email exists)
    secureLogger.info('Password reset requested', {
      email: sanitizedEmail,
      success: !error
    })

    return {
      success: true,
      data: {
        message: 'If an account with that email exists, we\'ve sent password reset instructions.'
      }
    }

  } catch (error) {
    secureLogger.error('Password reset action error', error)
    
    return {
      success: false,
      error: 'Unable to process password reset request. Please try again.'
    }
  }
}

/**
 * Generate CSRF token for forms
 */
export async function generateCSRFToken(userId?: string): Promise<string> {
  return await csrfProtection.generateToken(userId)
}

// Helper functions
async function countRecentFailures(): Promise<number> {
  // This would typically be implemented with your rate limiting store
  // For now, return a placeholder
  return 0
}

function validateRedirectUrl(url: string): string {
  if (!url || url === '/') return '/'
  
  // Only allow relative URLs or same-origin URLs
  try {
    const parsed = new URL(url, process.env.NEXT_PUBLIC_SITE_URL)
    const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL!)
    
    if (parsed.origin === siteUrl.origin) {
      return parsed.pathname + parsed.search
    }
  } catch {
    // Invalid URL, return safe default
  }
  
  return '/'
}

// Export types
export type { AuthResult, LoginData, RegisterData }
