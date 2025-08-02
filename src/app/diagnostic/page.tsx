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
        <p className="text-gray-600">
          Use this tool to diagnose admin creation and image upload issues.
        </p>
      </div>
      
      <AdminDiagnostic />
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold text-blue-900 mb-2">💡 Troubleshooting Steps:</h2>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
          <li>Run the diagnostic above to identify issues</li>
          <li>Go to Supabase SQL Editor and run these scripts in order:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li><code>fix-admin-database.sql</code> - Sets up admin functions</li>
              <li><code>fix-image-storage.sql</code> - Sets up image storage</li>
              <li><code>bootstrap-admin.sql</code> - Creates your first admin (edit with your email)</li>
            </ul>
          </li>
          <li>Go to Supabase Dashboard → Storage and verify the &quot;images&quot; bucket exists</li>
          <li>Run the diagnostic again to verify fixes</li>
        </ol>
      </div>
    </div>
  )
}
