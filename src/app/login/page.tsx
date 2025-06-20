'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { login } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Lock, Loader2 } from 'lucide-react'
import LoginRedirect from './LoginRedirect'

const initialState = { error: '' }

function LoginButton() {
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
          <span>Signing In...</span>
        </>
      ) : (
        <span>Sign In</span>
      )}
    </Button>
  )
}

export default function Login() {
  const [state, formAction] = useActionState(login, initialState)
  
  // Handle successful login
  useEffect(() => {
    if (state?.success) {
      // Force a page refresh to update auth state properly
      window.location.href = '/'
    }
  }, [state?.success])
  
  return (    <div className="min-h-screen auth-container">
      <LoginRedirect />
      <Card className="auth-card">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">💎</span>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome Back</CardTitle>          <CardDescription className="text-sm sm:text-base text-gray-600">
            Sign in to your jewelry collection account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={formAction} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-11 h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500 text-base transition-all duration-200"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-11 h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500 text-base transition-all duration-200"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            {state.error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-sm text-red-800">{state.error}</AlertDescription>
              </Alert>
            )}
            <LoginButton />
          </form>
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">New to SilverPalace?</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/register">
                <Button variant="outline" className="w-full h-12 border-amber-200 text-amber-700 hover:bg-amber-50 transition-all duration-200">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
