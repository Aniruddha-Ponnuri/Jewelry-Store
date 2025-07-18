'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { AdminUser } from '@/types/database'
import AdminLayout from '@/components/AdminLayout'
import AdminStatusDebug from '@/components/AdminStatusDebug'
import { Shield, RefreshCw } from 'lucide-react'

export default function AdminUsersPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const { user, refreshAdminStatus } = useAuth()
  const router = useRouter()
  const [adminUsers, setAdminUsers] = useState<(AdminUser & { full_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [refreshingStatus, setRefreshingStatus] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'master_admin'>('admin')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isMasterAdmin, setIsMasterAdmin] = useState(false)

  const supabase = createClient()

  // Load master admin emails and check if current user is master admin
  const loadMasterAdminStatus = useCallback(async () => {
    try {
      const { data: isMaster, error: isMasterError } = await supabase.rpc('is_master_admin')
      if (isMasterError) {
        console.error('Error checking master admin status:', isMasterError)
      } else {
        setIsMasterAdmin(Boolean(isMaster))
      }
    } catch (error) {
      console.error('Error loading master admin status:', error)
    }
  }, [supabase])

  // Redirect if not admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, adminLoading, router])  // Load admin users - simplified for robust admin system
  const loadAdminUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: admins, error } = await supabase
        .from('admin_users')
        .select('admin_id, user_id, email, role, is_active, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading admin users:', error)
        setMessage({ type: 'error', text: 'Failed to load admin users' })
        return
      }

      // Transform admin data
      const transformedAdmins: (AdminUser & { full_name?: string })[] = admins?.map(admin => ({
        admin_id: admin.admin_id || admin.user_id,
        user_id: admin.user_id,
        email: admin.email,
        role: admin.role || 'admin',
        permissions: {
          products: true,
          categories: true,
          users: true,
          admins: true
        }, 
        is_active: admin.is_active,
        created_at: admin.created_at,
        created_by: null,
        updated_at: admin.updated_at || admin.created_at,
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
      loadMasterAdminStatus()
    }
  }, [isAdmin, loadAdminUsers, loadMasterAdminStatus])
  
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
        admin_email: newAdminEmail.trim(),
        admin_role: newAdminRole
      })

      if (error) {
        console.error('Error adding admin:', error)
        setMessage({ type: 'error', text: error.message || 'Failed to add admin' })
        return
      }

      setMessage({ type: 'success', text: data || 'Admin added successfully' })
      setNewAdminEmail('')
      setNewAdminRole('admin')
      await loadAdminUsers()
      await loadMasterAdminStatus()
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
    // Only master admins can deactivate other admins
    if (!isMasterAdmin) {
      setMessage({ type: 'error', text: 'Only master admins can activate/deactivate other admin accounts' })
      return
    }

    // Prevent deactivating yourself
    if (adminUser.user_id === user?.id) {
      setMessage({ type: 'error', text: 'You cannot deactivate your own admin account' })
      return
    }

    // Prevent deactivating master admins if they are the last one
    if (adminUser.role === 'master_admin' && adminUser.is_active) {
      const activeMasterAdmins = adminUsers.filter(admin => 
        admin.role === 'master_admin' && admin.is_active
      ).length;
      
      if (activeMasterAdmins <= 1) {
        setMessage({ type: 'error', text: 'Cannot deactivate the last master admin account' })
        return
      }
    }

    try {
      console.log('Toggling admin status for user:', adminUser.user_id, 'from', adminUser.is_active, 'to', !adminUser.is_active)
      
      const { error } = await supabase
        .from('admin_users')
        .update({ 
          is_active: !adminUser.is_active, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', adminUser.user_id)

      if (error) {
        console.error('Error updating admin status:', error)
        setMessage({ type: 'error', text: `Failed to update admin status: ${error.message}` })
        return
      }

      setMessage({ 
        type: 'success', 
        text: `Admin ${adminUser.is_active ? 'deactivated' : 'activated'} successfully` 
      })
      
      // Reload admin users list and master admin status
      await loadAdminUsers()
      await loadMasterAdminStatus()
      
      // If we deactivated an admin, also refresh the current user's admin status
      if (adminUser.user_id === user?.id) {
        await refreshAdminStatus()
      }
    } catch (error) {
      console.error('Error updating admin status:', error)
      setMessage({ type: 'error', text: 'Failed to update admin status' })
    }
  }

  // Refresh admin status function
  const handleRefreshStatus = async () => {
    setRefreshingStatus(true)
    try {
      await refreshAdminStatus()
      await loadMasterAdminStatus()
      setMessage({ type: 'success', text: 'Admin status refreshed successfully' })
    } catch (error) {
      console.error('Error refreshing admin status:', error)
      setMessage({ type: 'error', text: 'Failed to refresh admin status' })
    } finally {
      setRefreshingStatus(false)
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
      )}

      {/* Add New Admin - Only for Master Admins */}
      {isMasterAdmin && (
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">Admin Role</Label>
                <Select value={newAdminRole} onValueChange={(value: 'admin' | 'master_admin') => setNewAdminRole(value)}>
                  <SelectTrigger className="text-sm sm:text-base px-4 py-3 border-2 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-200">
                    <SelectValue placeholder="Select admin role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Regular Admin</SelectItem>
                    <SelectItem value="master_admin">Master Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Master admins can add/remove other admins and create master admins. Regular admins can manage products and categories.
                </p>
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
        </Card>
      )}

      {/* Non-Master Admin Notice */}
      {!isMasterAdmin && (
        <Card className="mb-4 sm:mb-6 lg:mb-8 bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">Regular Admin Access</p>
                <p className="text-xs text-amber-700">
                  You can manage products and categories. Contact a master admin to add or remove admin users.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}      {/* Admin Users List */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Current Admins</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                All users with admin access. Master admins have full privileges, regular admins can manage products and categories.
              </CardDescription>
            </div>
            <Button
              onClick={handleRefreshStatus}
              disabled={refreshingStatus}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${refreshingStatus ? 'animate-spin' : ''}`} />
              {refreshingStatus ? 'Refreshing...' : 'Refresh Status'}
            </Button>
          </div>
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
                        {admin.role === 'master_admin' && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            Master Admin
                          </Badge>
                        )}
                        {admin.role === 'admin' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            Admin
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
                    {/* Activate/Deactivate button - available for all admins on other users, master admins can control all */}
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => toggleAdminStatus(admin)}
                      disabled={
                        // Regular admins can only deactivate themselves
                        (!isMasterAdmin && admin.user_id !== user?.id) ||
                        // Cannot deactivate yourself regardless of role
                        (admin.user_id === user?.id) ||
                        // Cannot deactivate last master admin
                        (admin.role === 'master_admin' && admin.is_active && adminUsers.filter(a => a.role === 'master_admin' && a.is_active).length <= 1)
                      }
                      className={`flex-1 sm:flex-initial px-6 py-3 text-base font-medium transition-all duration-200 shadow-sm border-2 ${
                        (!isMasterAdmin && admin.user_id !== user?.id) ||
                        (admin.user_id === user?.id) || 
                        (admin.role === 'master_admin' && admin.is_active && adminUsers.filter(a => a.role === 'master_admin' && a.is_active).length <= 1)
                          ? 'border-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'hover:scale-105 active:scale-95 hover:shadow-md hover:border-amber-300'
                      }`}
                      title={
                        !isMasterAdmin && admin.user_id !== user?.id
                          ? "Only master admins can manage other admin accounts"
                          : admin.user_id === user?.id 
                            ? "You cannot deactivate your own account" 
                            : (admin.role === 'master_admin' && admin.is_active && adminUsers.filter(a => a.role === 'master_admin' && a.is_active).length <= 1)
                              ? "Cannot deactivate the last master admin"
                              : undefined
                      }
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
                    
                    {/* Remove button - only shown to master admin for non-self admins */}
                    {isMasterAdmin && admin.user_id !== user?.id && (
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
                        <AlertDialogContent className="bg-white border-2 border-red-200 shadow-xl max-w-md w-[95vw] mx-auto">
                          <AlertDialogHeader className="bg-red-50 -m-6 mb-4 p-6 border-b border-red-200">
                            <AlertDialogTitle className="text-lg text-red-900 font-semibold">Remove Admin Access</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-red-700 mt-2">
                              Are you sure you want to remove admin access from <strong className="font-semibold">{admin.email}</strong>? 
                              This action cannot be undone and will immediately revoke all admin privileges.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-3 pt-4">
                            <AlertDialogCancel className="w-full sm:w-auto px-6 py-3 text-base font-medium hover:scale-105 active:scale-95 transition-all duration-200 bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 text-gray-800">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeAdmin(admin.email)}
                              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto px-6 py-3 text-base font-medium hover:scale-105 active:scale-95 transition-all duration-200 text-white border-2 border-red-600 hover:border-red-700"
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
      </Card>

      {/* Admin Status Debug Component - Only for Master Admins */}
      {isMasterAdmin && <AdminStatusDebug />}

      {/* Info Card */}
      <Card className="mt-4 sm:mt-6 lg:mt-8 bg-blue-50 border-blue-200">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-blue-900 text-base sm:text-lg">Admin System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-800 space-y-2 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <p><strong>Admin Types:</strong> Regular Admin and Master Admin roles</p>
                {isMasterAdmin ? (
                  <>
                    <p><strong>Master Admin:</strong> Full privileges including admin management, adding/removing admins, and creating master admins</p>
                    <p><strong>Regular Admin:</strong> Can manage products and categories only</p>
                  </>
                ) : (
                  <p><strong>Regular Admin:</strong> You can manage products and categories. Contact a master admin for user management.</p>
                )}
              </div>
              <div>
                <p><strong>Security:</strong> Role-based access control with database validation</p>
                {isMasterAdmin && (
                  <>
                    <p><strong>Protection:</strong> Cannot remove the last master admin or deactivate yourself</p>
                    <p><strong>Note:</strong> Users must register on the website before being made admin</p>
                  </>
                )}
                <p><strong>Your Role:</strong> {isMasterAdmin ? 'Master Admin (Full Access)' : 'Regular Admin (Product & Category Management)'}</p>
              </div>
            </div>
          </div>        </CardContent>
      </Card>
    </AdminLayout>
  )
}
