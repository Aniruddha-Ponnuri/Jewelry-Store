'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { forgotPassword } from '@/app/forgot-password/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowLeft, Loader2, CheckCircle, Info } from 'lucide-react'

const initialState = { error: '', success: false, message: '' }

function ForgotPasswordButton() {
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
          <span>Sending Reset Link...</span>
        </>
      ) : (
        <span>Send Reset Link</span>
      )}
    </Button>
  )
}

export default function ForgotPassword() {
  const [state, formAction] = useActionState(forgotPassword, initialState)
  const [email, setEmail] = useState('')
  
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  return (
    <div className="min-h-screen auth-container">
      <Card className="auth-card">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">💎</span>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
            Reset Password
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {state.success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">Check Your Email</h3>
                <p className="text-sm text-gray-600">
                  {state.message || 'We\'ve sent a password reset link to your email address.'}
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  Didn&apos;t receive the email? Check your spam folder or try again.
                </p>
              </div>
              <div className="pt-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full h-12">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <form action={formAction} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-11 h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500 text-base transition-all duration-200"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {email && !isValidEmail(email) && (
                    <p className="text-sm text-red-600">Please enter a valid email address</p>
                  )}
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-800">
                    We&apos;ll send you a secure link to reset your password. The link will expire in 1 hour for your security.
                  </AlertDescription>
                </Alert>

                {state.error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-sm text-red-800">
                      {state.error}
                    </AlertDescription>
                  </Alert>
                )}

                <ForgotPasswordButton />
              </form>

              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Remember your password?</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/login">
                    <Button variant="outline" className="w-full h-12 border-amber-200 text-amber-700 hover:bg-amber-50 transition-all duration-200">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
