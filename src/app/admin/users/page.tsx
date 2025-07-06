'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { AdminUser } from '@/types/database'
import AdminLayout from '@/components/AdminLayout'
import { Shield } from 'lucide-react'

export default function AdminUsersPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const { user } = useAuth()
  const router = useRouter()
  const [adminUsers, setAdminUsers] = useState<(AdminUser & { full_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  // Check if current user is the master admin (admin@silver.com)
  const isMasterAdmin = user?.email === 'admin@silver.com'

  // Redirect if not admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, adminLoading, router])  // Load admin users - optimized with memoization and minimal data fetching
  const loadAdminUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      // Query with only the fields that actually exist in the database
      const { data: admins, error } = await supabase
        .from('admin_users')
        .select('admin_id, user_id, email, is_active, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50) // Limit to improve performance

      if (error) {
        console.error('Error loading admin users:', error)
        setMessage({ type: 'error', text: 'Failed to load admin users' })
        return
      }

      // Transform with proper defaults for missing fields
      const transformedAdmins: (AdminUser & { full_name?: string })[] = admins?.map(admin => ({
        admin_id: admin.admin_id,
        user_id: admin.user_id,
        email: admin.email,
        role: 'admin', // Default role since all admins have the same permissions
        permissions: { // Default permissions for all admins
          products: true,
          categories: true,
          users: true,
          admins: true
        }, 
        is_active: admin.is_active,
        created_at: admin.created_at,
        created_by: null, // Not tracked in simplified table
        updated_at: admin.updated_at || admin.created_at, // Fallback to created_at
        full_name: admin.email.split('@')[0].charAt(0).toUpperCase() + admin.email.split('@')[0].slice(1)
      })) || []

      setAdminUsers(transformedAdmins)
    } catch (error) {
      console.error('Error loading admin users:', error)
      setMessage({ type: 'error', text: 'Failed to load admin users' })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (isAdmin) {
      loadAdminUsers()
    }
  }, [isAdmin, loadAdminUsers])
  const addAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newAdminEmail.trim())) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }

    try {
      setAddingAdmin(true)
      
      const { data, error } = await supabase.rpc('add_admin', { 
        admin_email: newAdminEmail.trim() 
      })

      if (error) {
        console.error('Error adding admin:', error)
        setMessage({ type: 'error', text: error.message || 'Failed to add admin' })
        return
      }

      setMessage({ type: 'success', text: data || 'Admin added successfully' })
      setNewAdminEmail('')
      await loadAdminUsers()
    } catch (error) {
      console.error('Error adding admin:', error)
      setMessage({ type: 'error', text: 'Failed to add admin' })
    } finally {
      setAddingAdmin(false)
    }
  }
  const removeAdmin = async (email: string) => {
    if (!isMasterAdmin) {
      setMessage({ type: 'error', text: 'Only the master admin can remove other admins' })
      return
    }

    try {
      const { data, error } = await supabase.rpc('remove_admin', { 
        admin_email: email 
      })

      if (error) {
        console.error('Error removing admin:', error)
        setMessage({ type: 'error', text: error.message || 'Failed to remove admin' })
        return
      }

      setMessage({ type: 'success', text: data || 'Admin removed successfully' })
      await loadAdminUsers()
    } catch (error) {
      console.error('Error removing admin:', error)
      setMessage({ type: 'error', text: 'Failed to remove admin' })
    }
  }
  const toggleAdminStatus = async (adminUser: AdminUser) => {
    // Prevent deactivating the master admin
    if (adminUser.email === 'admin@silver.com' && adminUser.is_active) {
      setMessage({ type: 'error', text: 'Cannot deactivate the master admin account' })
      return
    }

    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: !adminUser.is_active })
        .eq('admin_id', adminUser.admin_id)

      if (error) {
        console.error('Error updating admin status:', error)
        setMessage({ type: 'error', text: 'Failed to update admin status' })
        return
      }

      setMessage({ 
        type: 'success', 
        text: `Admin ${adminUser.is_active ? 'deactivated' : 'activated'} successfully` 
      })
      await loadAdminUsers()
    } catch (error) {
      console.error('Error updating admin status:', error)
      setMessage({ type: 'error', text: 'Failed to update admin status' })
    }
  }

  // Memoize admin users to prevent unnecessary re-renders
  const memoizedAdminUsers = useMemo(() => adminUsers, [adminUsers])

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])
  if (adminLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-600 mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">Loading Admin Dashboard...</p>
          <p className="text-sm text-gray-500">Please wait while we prepare your admin tools</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }  return (    <AdminLayout 
      title="Admin Management" 
      description="Manage admin users for the SilverPalace website"
    >{/* Messages */}
      {message && (
        <Alert className={`mb-3 sm:mb-4 lg:mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <AlertDescription className={`${message.type === 'error' ? 'text-red-800' : 'text-green-800'} text-xs sm:text-sm lg:text-base`}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}      {/* Add New Admin */}
      <Card className="mb-4 sm:mb-6 lg:mb-8">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Add New Admin</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Add a new admin user by email. The user must already be registered on the website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="text-sm sm:text-base px-4 py-3 border-2 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                autoComplete="email"
              />
            </div>            <Button 
              onClick={addAdmin} 
              disabled={addingAdmin || !newAdminEmail.trim()}
              className="w-full sm:w-auto sm:self-start px-6 py-3 text-base font-semibold hover:scale-105 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              size="lg"
            >
              <span className="flex items-center gap-2">
                {addingAdmin ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding Admin...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Add New Admin
                  </>
                )}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>      {/* Admin Users List */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Current Admins</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            All users with admin access. Note: There is only one type of admin with full permissions.
          </CardDescription>
        </CardHeader>        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {/* Skeleton loaders for better UX */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-10 w-20 bg-gray-300 rounded"></div>
                      <div className="h-10 w-16 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : adminUsers.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">No admin users found</div>
          ) : (            <div className="space-y-3 sm:space-y-4">
              {memoizedAdminUsers.map((admin) => (
                <div key={admin.admin_id} className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex-1 min-w-0 space-y-2 sm:space-y-1">
                    <div className="flex flex-wrap items-start sm:items-center gap-2">
                      <h3 className="font-medium text-sm sm:text-base truncate flex-1">{admin.full_name || 'Admin User'}</h3>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <Badge variant={admin.is_active ? 'default' : 'secondary'} className="text-xs">
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {admin.email === 'admin@silver.com' && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            Master Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-gray-600 break-all">{admin.email}</p>
                      <p className="text-xs text-gray-400">
                        Added: {new Date(admin.created_at).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>                  <div className="flex gap-3 w-full sm:w-auto sm:flex-col lg:flex-row">
                    {/* Activate/Deactivate button - disabled for master admin deactivation */}
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => toggleAdminStatus(admin)}
                      disabled={admin.email === 'admin@silver.com' && admin.is_active}
                      className="flex-1 sm:flex-initial px-6 py-3 text-base font-medium hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md border-2 hover:border-amber-300"
                    >
                      <span className="flex items-center gap-2">
                        {admin.is_active ? (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Deactivate
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Activate
                          </>
                        )}
                      </span>
                    </Button>
                    
                    {/* Remove button - only shown to master admin for non-master admins */}
                    {isMasterAdmin && admin.email !== 'admin@silver.com' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="lg" 
                            className="flex-1 sm:flex-initial px-6 py-3 text-base font-medium hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                          >
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                              Remove Admin
                            </span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base sm:text-lg">Remove Admin Access</AlertDialogTitle>
                            <AlertDialogDescription className="break-words text-sm">
                              Are you sure you want to remove admin access from {admin.email}? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto px-4 py-2 text-base hover:scale-105 active:scale-95 transition-all duration-200">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeAdmin(admin.email)}
                              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto px-4 py-2 text-base hover:scale-105 active:scale-95 transition-all duration-200"
                            >
                              Remove Admin
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>      {/* Info Card */}
      <Card className="mt-4 sm:mt-6 lg:mt-8 bg-blue-50 border-blue-200">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-blue-900 text-base sm:text-lg">Admin System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-800 space-y-2 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <p><strong>Admin Type:</strong> Single admin role with full permissions</p>
                <p><strong>Permissions:</strong> All admins can manage products, categories, and add other admins</p>
                <p><strong>Remove Admins:</strong> Only Master Admin can remove other admin users</p>
              </div>
              <div>
                <p><strong>Security:</strong> Admin access is database-driven, not environment-based</p>
                <p><strong>Note:</strong> Users must be registered on the website before being made admin</p>
                {isMasterAdmin && (
                  <p><strong>Master Admin:</strong> You have full admin management privileges</p>
                )}
              </div>
            </div>
          </div>        </CardContent>
      </Card>
    </AdminLayout>
  )
}
