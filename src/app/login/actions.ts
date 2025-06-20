'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function login(prevState: { error?: string } | undefined, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Revalidate all pages to update auth state
  revalidatePath('/', 'layout')
  
  // Instead of redirecting immediately, return success
  // Let the client handle the redirect to avoid refresh issues
  return { success: true }
}
