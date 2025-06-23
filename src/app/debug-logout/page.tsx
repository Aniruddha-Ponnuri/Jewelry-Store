'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { logout } from '@/app/logout/actions'

export default function DebugLogoutPage() {
  const { user, signOut, forceSignOut } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<{[key: string]: boolean | null}>({})

  const testMethod = async (methodName: string, method: () => Promise<void>) => {
    setLoading(methodName)
    setResults(prev => ({ ...prev, [methodName]: null }))
    
    try {
      await method()
      setResults(prev => ({ ...prev, [methodName]: true }))
    } catch (error) {
      console.error(`${methodName} failed:`, error)
      setResults(prev => ({ ...prev, [methodName]: false }))
    } finally {
      setLoading(null)
    }
  }

  const testClientLogout = () => testMethod('Client Logout', signOut)
  const testForceLogout = () => testMethod('Force Logout', forceSignOut)
  
  const testServerAction = () => testMethod('Server Action', async () => {
    await logout()
  })

  const testApiRoute = () => testMethod('API Route', async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST' })
    if (!response.ok) throw new Error('API route failed')
    window.location.href = '/'
  })

  const testDirectRedirect = () => testMethod('Direct Redirect', async () => {
    window.location.href = '/logout'
  })

  const testClearStorage = () => testMethod('Clear Storage', async () => {
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  })

  const ResultIcon = ({ result }: { result: boolean | null }) => {
    if (result === null) return <div className="w-5 h-5" />
    if (result === true) return <CheckCircle className="w-5 h-5 text-green-500" />
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Not Logged In
            </CardTitle>
            <CardDescription>
              You are not currently logged in. The logout functionality appears to be working correctly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/login">Go to Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Logout Debug Tool
          </CardTitle>
          <CardDescription>
            Test different logout methods to identify what&apos;s working.
            <br />
            Currently logged in as: <strong>{user.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ResultIcon result={results['Client Logout']} />
                <Button 
                  onClick={testClientLogout}
                  disabled={loading !== null}
                  variant="outline"
                  className="flex-1"
                >
                  {loading === 'Client Logout' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Test Client Logout
                </Button>
              </div>
              <p className="text-sm text-gray-600">Uses AuthContext signOut function</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ResultIcon result={results['Force Logout']} />
                <Button 
                  onClick={testForceLogout}
                  disabled={loading !== null}
                  variant="outline"
                  className="flex-1"
                >
                  {loading === 'Force Logout' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Test Force Logout
                </Button>
              </div>
              <p className="text-sm text-gray-600">Client-only logout with storage clear</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ResultIcon result={results['API Route']} />
                <Button 
                  onClick={testApiRoute}
                  disabled={loading !== null}
                  variant="outline"
                  className="flex-1"
                >
                  {loading === 'API Route' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Test API Route
                </Button>
              </div>
              <p className="text-sm text-gray-600">Direct call to /api/auth/logout</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ResultIcon result={results['Server Action']} />
                <Button 
                  onClick={testServerAction}
                  disabled={loading !== null}
                  variant="outline"
                  className="flex-1"
                >
                  {loading === 'Server Action' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Test Server Action
                </Button>
              </div>
              <p className="text-sm text-gray-600">Uses server action logout</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ResultIcon result={results['Direct Redirect']} />
                <Button 
                  onClick={testDirectRedirect}
                  disabled={loading !== null}
                  variant="outline"
                  className="flex-1"
                >
                  {loading === 'Direct Redirect' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Test Logout Page
                </Button>
              </div>
              <p className="text-sm text-gray-600">Redirect to /logout page</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ResultIcon result={results['Clear Storage']} />
                <Button 
                  onClick={testClearStorage}
                  disabled={loading !== null}
                  variant="outline"
                  className="flex-1"
                >
                  {loading === 'Clear Storage' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Clear Storage & Reload
                </Button>
              </div>
              <p className="text-sm text-gray-600">Nuclear option: clear all storage</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Debug Information</h3>
            <div className="text-sm space-y-1">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Browser:</strong> {navigator.userAgent}</p>
              <p><strong>Cookies Enabled:</strong> {navigator.cookieEnabled ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
