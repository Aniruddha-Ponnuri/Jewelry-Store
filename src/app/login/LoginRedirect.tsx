'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginRedirect() {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Small delay to ensure auth state is properly set
      setTimeout(() => {
        if (isAdmin) {
          router.push('/admin/users')
        } else {
          router.push('/')
        }
      }, 100)
    }
  }, [user, isAdmin, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return null
}
