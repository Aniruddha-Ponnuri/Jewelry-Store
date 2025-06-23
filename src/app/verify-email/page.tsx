'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function EmailVerificationPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Email verification error:', error)
          setStatus('error')
          setMessage('Failed to verify your email. The verification link may be invalid or expired.')
          return
        }

        if (data.session) {
          setStatus('success')
          setMessage('Your email has been verified successfully! You can now access all features.')
        } else {
          setStatus('expired')
          setMessage('The verification link has expired or is invalid. Please request a new verification email.')
        }
      } catch (error) {
        console.error('Email verification error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred during email verification.')
      }
    }

    verifyEmail()
  }, [])

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-amber-600" />
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />
      case 'error':
        return <XCircle className="h-12 w-12 text-red-600" />
      case 'expired':
        return <AlertTriangle className="h-12 w-12 text-orange-600" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Your Email...'
      case 'success':
        return 'Email Verified Successfully!'
      case 'error':
        return 'Verification Failed'
      case 'expired':
        return 'Verification Link Expired'
    }
  }

  const getButtonText = () => {
    switch (status) {
      case 'success':
        return 'Continue to Dashboard'
      case 'error':
      case 'expired':
        return 'Back to Login'
      default:
        return 'Please wait...'
    }
  }

  const getButtonHref = () => {
    switch (status) {
      case 'success':
        return '/'
      default:
        return '/login'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status !== 'loading' && (
            <>
              {status === 'error' && (
                <Alert variant="destructive">
                  <AlertDescription>
                    If you continue to experience issues, please contact our support team.
                  </AlertDescription>
                </Alert>
              )}
              
              {status === 'expired' && (
                <Alert>
                  <AlertDescription>
                    You can request a new verification email from the registration page.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <Link href={getButtonHref()}>                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    {getButtonText()}
                  </Button>
                </Link>
                
                {status !== 'success' && (
                  <Link href="/register">
                    <Button variant="outline" className="w-full h-12">
                      Create New Account
                    </Button>
                  </Link>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
