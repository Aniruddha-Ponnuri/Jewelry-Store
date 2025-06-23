'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function LogoutPage() {
  const { signOut } = useAuth()

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut()
      } catch (error) {
        console.error('Logout page error:', error)
        // Force redirect as fallback
        window.location.href = '/'
      }
    }

    performLogout()
  }, [signOut])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-600 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Logging you out...</h2>
        <p className="text-sm text-gray-600">Please wait while we securely log you out.</p>
      </div>
    </div>
  )
}
