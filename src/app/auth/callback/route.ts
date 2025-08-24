import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Successful authentication - redirect to the intended page
        return NextResponse.redirect(new URL(next, requestUrl.origin))
      } else {
        console.error('Auth callback error:', error)
      }
    } catch (error) {
      console.error('Auth callback error:', error)
    }
  }

  // Redirect to home page if there's an error or no code
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
