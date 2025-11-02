import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('🔐 [LOGIN API] Attempting login for:', email)
    
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ [LOGIN API] Login failed:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('✅ [LOGIN API] Login successful:', {
      userId: data.user?.id,
      email: data.user?.email,
      hasSession: !!data.session,
      sessionExpires: data.session?.expires_at
    })

    // Return success
    return NextResponse.json({ 
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    })
    
  } catch (error) {
    console.error('💥 [LOGIN API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
