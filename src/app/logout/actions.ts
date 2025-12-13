'use server'

import { createLogoutClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function logout() {
  const startTime = Date.now()

  try {
    logger.auth('Server action logout initiated')

    const supabase = await createLogoutClient()
    const cookieStore = await cookies()

    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.warn('Server action logout error', { error: error.message })
    } else {
      logger.auth('Server action signOut successful')
    }

    // Clear auth cookies
    const allCookies = cookieStore.getAll()
    const patterns = [/^sb-.*-auth-token$/, /^supabase-auth-token$/, /^supabase\.auth\.token$/]

    let cleared = 0
    allCookies.forEach(cookie => {
      if (patterns.some(p => p.test(cookie.name))) {
        cookieStore.set(cookie.name, '', {
          maxAge: 0,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
        cleared++
      }
    })

    revalidatePath('/', 'layout')
    logger.auth('Server action logout completed', { clearedCookies: cleared })
    logger.perf('Logout action', startTime)

  } catch (error) {
    logger.error('Server logout action error', error)
  }

  redirect('/')
}
