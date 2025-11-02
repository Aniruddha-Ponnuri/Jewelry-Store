'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function login(prevState: { error?: string } | undefined, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  console.log('🔐 [LOGIN ACTION] Attempting login for:', email)
  
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('❌ [LOGIN ACTION] Login failed:', error.message)
    return { error: error.message }
  }

  console.log('✅ [LOGIN ACTION] Login successful:', {
    userId: data.user?.id,
    email: data.user?.email,
    hasSession: !!data.session,
    sessionExpires: data.session?.expires_at
  })

  // Revalidate all pages to update auth state
  revalidatePath('/', 'layout')
  
  console.log('🔄 [LOGIN ACTION] Revalidated layout, returning success')
  
  // Instead of redirecting immediately, return success
  // Let the client handle the redirect to avoid refresh issues
  return { success: true }
}
