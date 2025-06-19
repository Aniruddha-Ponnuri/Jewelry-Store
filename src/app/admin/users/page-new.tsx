'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Trash2, UserPlus, Shield } from 'lucide-react'
import type { AdminUser } from '@/types/database'

export default function AdminUsers() {
  const router = useRouter()
  const { canManageAdmins, loading: adminLoading } = useAdmin()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')

  const fetchAdmins = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAdmins(data || [])
    } catch (error) {
      console.error('Error fetching admins:', error)
      toast.error('Failed to load admin users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!adminLoading) {
      if (!canManageAdmins) {
        router.push('/')
        return
      }
      fetchAdmins()
    }
  }, [adminLoading, canManageAdmins, router, fetchAdmins])

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    try {
      const supabase = createClient()
      
      // Use the add_admin function
      const { data, error } = await supabase.rpc('add_admin', {
        admin_email: newAdminEmail.trim()
      })

      if (error) throw error

      toast.success(data || 'Admin user added successfully')
      setNewAdminEmail('')
      setShowAddForm(false)
      fetchAdmins()
    } catch (error: unknown) {
      console.error('Error adding admin:', error)
      toast.error('Failed to add admin user')
    }
  }

  const handleRemoveAdmin = async (adminEmail: string) => {
    try {
      const supabase = createClient()
      
      // Use the remove_admin function
      const { data, error } = await supabase.rpc('remove_admin', {
        admin_email: adminEmail
      })

      if (error) throw error

      toast.success(data || 'Admin user removed successfully')
      fetchAdmins()
    } catch (error) {
      console.error('Error removing admin:', error)
      toast.error('Failed to remove admin user')
    }
  }

  if (adminLoading || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin users...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!canManageAdmins) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don&apos;t have permission to manage admin users.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-gray-600 mt-2">Manage admin users and their access</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Admin
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Admin</CardTitle>
            <CardDescription>
              Add a new admin user. The user must already be registered in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddAdmin}>Add Admin</Button>
              <Button variant="outline" onClick={() => {
                setShowAddForm(false)
                setNewAdminEmail('')
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {admins.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Admin Users</h3>
                <p className="text-gray-600 mb-4">
                  There are no admin users configured yet.
                </p>
                <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add First Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Admin Users ({admins.length})</CardTitle>
              <CardDescription>
                All users with admin access. In this simplified system, all admins have full permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div key={admin.admin_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100">
                        <Shield className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{admin.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={admin.is_active ? "default" : "secondary"}>
                            {admin.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            Admin
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Added {new Date(admin.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove admin access for {admin.email}? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveAdmin(admin.email)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove Admin
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Admin System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Simple Admin System</h4>
              <p>This system uses a simplified admin approach:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All admins have full permissions (no role-based restrictions)</li>
                <li>Users must register in the system before being made admin</li>
                <li>Admins can add and remove other admins</li>
                <li>Admin status is checked via the database, not environment variables</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Admin Permissions</h4>
              <p>All admins can:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Manage products (create, edit, delete)</li>
                <li>Manage categories (create, edit, delete)</li>
                <li>Manage admin users (add, remove)</li>
                <li>Upload and manage product images</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
