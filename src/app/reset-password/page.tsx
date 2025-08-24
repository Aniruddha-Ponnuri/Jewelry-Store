'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { resetPassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

const initialState = { error: '', success: false, message: '' }

function ResetPasswordButton() {
  const { pending } = useFormStatus()
  return (
    <Button 
      type="submit" 
      className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-base shadow-lg transition-all duration-200 transform hover:scale-[1.02]" 
      aria-disabled={pending} 
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span>Updating Password...</span>
        </>
      ) : (
        <span>Update Password</span>
      )}
    </Button>
  )
}

export default function ResetPassword() {
  const [state, formAction] = useActionState(resetPassword, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const accessToken = searchParams.get('access_token')
  const refreshToken = searchParams.get('refresh_token')

  useEffect(() => {
    if (state.success) {
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  }, [state.success, router])

  if (!accessToken || !refreshToken) {
    return (
      <div className="min-h-screen auth-container">
        <Card className="auth-card">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-600 font-bold text-2xl">⚠️</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Invalid Reset Link</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please request a new password reset link.
              </p>
              <Link href="/forgot-password">
                <Button className="w-full h-12">
                  Request New Reset Link
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full h-12">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen auth-container">
      <Card className="auth-card">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">💎</span>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
            Set New Password
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">
            Choose a strong password for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {state.success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Password Updated!</h3>
                <p className="text-sm text-gray-600">
                  Your password has been successfully updated. You can now sign in with your new password.
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  Redirecting to sign in page...
                </p>
              </div>
              <div className="pt-4">
                <Link href="/login">
                  <Button className="w-full h-12">
                    Continue to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form action={formAction} className="space-y-5">
              {/* Hidden fields for tokens */}
              <input type="hidden" name="access_token" value={accessToken} />
              <input type="hidden" name="refresh_token" value={refreshToken} />

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    className="pl-11 pr-11 h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500 text-base transition-all duration-200"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className="pl-11 pr-11 h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500 text-base transition-all duration-200"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium mb-1">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>At least 6 characters long</li>
                  <li>Include uppercase and lowercase letters</li>
                  <li>Include at least one number</li>
                  <li>Include at least one special character</li>
                </ul>
              </div>

              {state.error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-sm text-red-800">
                    {state.error}
                  </AlertDescription>
                </Alert>
              )}

              <ResetPasswordButton />
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
