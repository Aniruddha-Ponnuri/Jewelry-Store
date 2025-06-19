'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { AdminUser } from '@/types/database'

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
  }, [isAdmin, adminLoading, router])  // Load admin users
  const loadAdminUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get admin users - simplified query without users table join
      const { data: admins, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading admin users:', error)
        setMessage({ type: 'error', text: 'Failed to load admin users' })
        return
      }

      // Transform the data - extract name from email for display
      const transformedAdmins = admins?.map(admin => {
        // Extract name from email (before @ symbol) as display name
        const emailName = admin.email.split('@')[0]
        const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1)
        
        return {
          ...admin,
          full_name: displayName
        }
      }) || []

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

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (adminLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Management</h1>
        <p className="text-gray-600">Manage admin users for the Silver Jewelry website</p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Admin */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Admin</CardTitle>
          <CardDescription>
            Add a new admin user by email. The user must already be registered on the website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="email"
              placeholder="Enter email address"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={addAdmin} 
              disabled={addingAdmin || !newAdminEmail.trim()}
            >
              {addingAdmin ? 'Adding...' : 'Add Admin'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Admins</CardTitle>
          <CardDescription>
            All users with admin access. Note: There is only one type of admin with full permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading admin users...</div>
          ) : adminUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No admin users found</div>
          ) : (
            <div className="space-y-4">
              {adminUsers.map((admin) => (                <div key={admin.admin_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{admin.full_name || 'Admin User'}</h3>
                      <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {admin.email === 'admin@silver.com' && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Master Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                    <p className="text-xs text-gray-400">
                      Added: {new Date(admin.created_at).toLocaleDateString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>                    <div className="flex gap-2">
                    {/* Activate/Deactivate button - disabled for master admin deactivation */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAdminStatus(admin)}
                      disabled={admin.email === 'admin@silver.com' && admin.is_active}
                    >
                      {admin.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    
                    {/* Remove button - only shown to master admin for non-master admins */}
                    {isMasterAdmin && admin.email !== 'admin@silver.com' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove admin access from {admin.email}? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeAdmin(admin.email)}
                              className="bg-red-600 hover:bg-red-700"
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
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Admin System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-800 space-y-2">
            <p><strong>Admin Type:</strong> Single admin role with full permissions</p>
            <p><strong>Permissions:</strong> All admins can manage products, categories, and add other admins</p>
            <p><strong>Remove Admins:</strong> Only admin@silver.com can remove other admin users</p>
            <p><strong>Security:</strong> Admin access is database-driven, not environment-based</p>
            <p><strong>Note:</strong> Users must be registered on the website before being made admin</p>
            {isMasterAdmin && (
              <p><strong>Master Admin:</strong> You have full admin management privileges</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
