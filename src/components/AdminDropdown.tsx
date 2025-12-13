'use client'

import { useAuth } from '@/contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Package, FolderOpen, Users, ChevronDown, Activity } from 'lucide-react'
import Link from 'next/link'

export default function AdminDropdown() {
  const { isAdmin, isMasterAdmin } = useAuth()

  // Don't render if user is not admin
  if (!isAdmin) {
    return null
  }

  return (
    <div className="hidden lg:block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 hover:from-amber-100 hover:to-amber-200 text-amber-700 hover:text-amber-800"
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
            {isMasterAdmin && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs px-1 py-0">
                Master
              </Badge>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {/* Header */}
          <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">
                {isMasterAdmin ? 'Master Admin' : 'Admin Panel'}
              </span>
            </div>
          </div>

          {/* Dashboard */}
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center gap-3 cursor-pointer">
              <Shield className="w-4 h-4 text-amber-600" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Dashboard</span>
                <span className="text-xs text-gray-500">Overview & analytics</span>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Management */}
          <DropdownMenuItem asChild>
            <Link href="/admin/products" className="flex items-center gap-3 cursor-pointer">
              <Package className="w-4 h-4 text-purple-600" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Products</span>
                <span className="text-xs text-gray-500">Manage inventory</span>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/admin/categories" className="flex items-center gap-3 cursor-pointer">
              <FolderOpen className="w-4 h-4 text-green-600" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Categories</span>
                <span className="text-xs text-gray-500">Organize products</span>
              </div>
            </Link>
          </DropdownMenuItem>

          {/* Master Admin Only */}
          {isMasterAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/users" className="flex items-center gap-3 cursor-pointer">
                  <Users className="w-4 h-4 text-blue-600" />
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium">User Management</span>
                    <span className="text-xs text-gray-500">Manage admin access</span>
                  </div>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/admin/diagnostic" className="flex items-center gap-3 cursor-pointer">
                  <Activity className="w-4 h-4 text-red-600" />
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium">Diagnostics</span>
                    <span className="text-xs text-gray-500">Debug & troubleshoot</span>
                  </div>
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
