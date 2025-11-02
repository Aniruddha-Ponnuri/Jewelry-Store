'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Lock, Loader2 } from 'lucide-react'
import LoginRedirect from './LoginRedirect'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      console.log('🔐 [LOGIN] Submitting login for:', email)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ [LOGIN] Login failed:', data.error)
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }
      
      console.log('✅ [LOGIN] Login successful!')
      console.log('📊 [LOGIN] Cookies set:', document.cookie.includes('sb-jfuhcgnjqfeznqpbloze-auth-token'))
      
      // Force a hard redirect to ensure auth state refreshes
      console.log('� [LOGIN] Forcing page refresh...')
      window.location.href = '/'
      
    } catch (err) {
      console.error('💥 [LOGIN] Unexpected error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }
  
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-11 h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500 text-base transition-all duration-200"
                  required
                  autoComplete="email"
                  disabled={loading}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-11 h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500 text-base transition-all duration-200"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>            </div>
            
            <div className="flex items-center justify-between">
              <div></div>
              <Link 
                href="/forgot-password" 
                className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>
            
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-sm text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-base shadow-lg transition-all duration-200 transform hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
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
