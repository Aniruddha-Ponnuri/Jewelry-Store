'use server'

import { createClient } from '@/lib/supabase/server'

export async function resetPassword(
  prevState: { error: string; success: boolean; message: string }, 
  formData: FormData
): Promise<{ error: string; success: boolean; message: string }> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const accessToken = formData.get('access_token') as string
  const refreshToken = formData.get('refresh_token') as string
  // Validation
  if (!password || !confirmPassword) {
    return { error: 'Password and confirmation are required', success: false, message: '' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match', success: false, message: '' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long', success: false, message: '' }
  }

  if (!accessToken || !refreshToken) {
    return { error: 'Invalid reset link. Please request a new password reset.', success: false, message: '' }
  }

  try {
    const supabase = await createClient()

    // Set the session using the tokens from the reset link
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) {
      console.error('Session error:', sessionError)
      return { error: 'Invalid or expired reset link. Please request a new password reset.', success: false, message: '' }
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return { error: 'Failed to update password. Please try again.', success: false, message: '' }
    }

    // Sign out the user so they need to log in with the new password
    await supabase.auth.signOut()

    return { 
      success: true, 
      error: '',
      message: 'Password updated successfully. You can now sign in with your new password.'
    }
  } catch (error) {
    console.error('Reset password error:', error)
    return { 
      error: 'An unexpected error occurred. Please try again later.', 
      success: false,
      message: ''
    }
  }
}
