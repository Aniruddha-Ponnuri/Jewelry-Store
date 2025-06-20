'use client'

import { useAdmin } from '@/hooks/useAdmin'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Shield, Package, FolderOpen } from 'lucide-react'
import Link from 'next/link'

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { isAdmin, loading } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, loading, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
              {description && (
                <p className="text-xs sm:text-sm text-gray-600">{description}</p>
              )}
            </div>            <Badge variant="outline" className="bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-300 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold w-fit shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
              🛡️ Admin Dashboard
            </Badge>
          </div>
        </div>
      </div>      {/* Admin Navigation Breadcrumbs */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link 
              href="/admin/users" 
              className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 hover:border-amber-300 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Admin Management</span>
            </Link>
            <Link 
              href="/admin/products" 
              className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 hover:border-amber-300 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Products</span>
            </Link>
            <Link 
              href="/admin/categories" 
              className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 hover:border-amber-300 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            >
              <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Categories</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {children}
      </div>
    </div>
  )
}
