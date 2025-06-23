'use server'

import { createLogoutClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function logout() {
  try {
    console.log('Server action logout called')
    
    const supabase = await createLogoutClient()
    const cookieStore = await cookies()
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Server action logout error:', error)
    } else {
      console.log('Server action Supabase signOut successful')
    }
    
    // Clear any remaining auth cookies manually
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
        console.log(`Server action clearing cookie: ${cookie.name}`)
        cookieStore.set(cookie.name, '', {
          maxAge: 0,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
      }
    })

    // Revalidate the entire layout to ensure fresh data
    revalidatePath('/', 'layout')
    console.log('Server action logout completed')
    
  } catch (error) {
    console.error('Server logout error:', error)
  }
  
  // Always redirect to home page
  redirect('/')
}
