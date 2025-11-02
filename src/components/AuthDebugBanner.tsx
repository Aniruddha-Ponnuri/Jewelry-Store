'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

export default function AuthDebugBanner() {
  const { user, isAdmin, isMasterAdmin, loading } = useAuth()

  useEffect(() => {
    console.log('🔍 [AUTH DEBUG BANNER] Current auth state:', {
      user: user ? { id: user.id, email: user.email } : null,
      isAdmin,
      isMasterAdmin,
      loading
    })
  }, [user, isAdmin, isMasterAdmin, loading])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null

  if (loading) {
    return (
      <div className="bg-blue-100 border-b border-blue-300 px-4 py-2 text-sm text-center">
        <span className="font-semibold">🔄 Loading auth state...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 text-sm text-center">
        <span className="font-semibold">👤 Not logged in</span>
        {' | '}
        <a href="/login" className="text-blue-600 hover:underline">Login</a>
      </div>
    )
  }

  return (
    <div className={`border-b px-4 py-2 text-sm text-center ${
      isAdmin ? 'bg-amber-100 border-amber-300' : 'bg-green-100 border-green-300'
    }`}>
      <span className="font-semibold">
        {isAdmin ? (isMasterAdmin ? '👑 Master Admin' : '🛡️ Admin') : '✅ Logged In'}
      </span>
      {' | '}
      <span>{user.email}</span>
      {' | '}
      <span>ID: {user.id.substring(0, 8)}...</span>
      {' | '}
      <a href="/logout" className="text-blue-600 hover:underline">Logout</a>
    </div>
  )
}
