'use client'

import AdminDiagnostic from '@/components/AdminDiagnostic'
import { useRobustAuth } from '@/hooks/useRobustAuth'

export default function DiagnosticPage() {
  const auth = useRobustAuth({
    requireAuth: true,
    redirectOnFail: '/login'
  })

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to access diagnostic tools.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔧 Admin & Upload Diagnostic
        </h1>
      </div>
      <AdminDiagnostic />
    </div>
  )
}
