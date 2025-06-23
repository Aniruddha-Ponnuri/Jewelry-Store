'use server'

import { createClient } from '@/lib/supabase/server'

export async function forgotPassword(
  prevState: { error: string; success: boolean; message: string }, 
  formData: FormData
): Promise<{ error: string; success: boolean; message: string }>{
  const email = formData.get('email') as string
  if (!email) {
    return { error: 'Email is required', success: false, message: '' }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jewelry-store-swart.vercel.app'}/reset-password`,
    })

    if (error) {
      console.error('Forgot password error:', error)
      return { 
        error: 'Unable to send reset email. Please check your email address and try again.', 
        success: false,
        message: ''
      }
    }

    return { 
      success: true, 
      error: '',
      message: `Password reset link has been sent to ${email}. Please check your email and follow the instructions.`
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    return { 
      error: 'An unexpected error occurred. Please try again later.', 
      success: false,
      message: ''
    }
  }
}
