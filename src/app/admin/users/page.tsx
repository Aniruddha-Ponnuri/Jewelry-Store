'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRobustAuth } from '@/hooks/useRobustAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { AdminUser } from '@/types/database'
import RobustAdminLayout from '@/components/RobustAdminLayout'
import AdminDebug from '@/components/AdminDebug'
import AdminUsersDebug from '@/components/AdminUsersDebug'
import { Shield, RefreshCw, Users, Crown, UserPlus } from 'lucide-react'

export default function RobustAdminUsersPage() {
  const auth = useRobustAuth({
    requireAuth: true,
    requireAdmin: true,
    requireMasterAdmin: true, // Only master admins can access user management
    redirectOnFail: '/',
    refreshInterval: 60000
  })
  
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'master_admin'>('all')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)
  
  const supabase = useMemo(() => createClient(), [])

  // Load users
  const loadUsers = useCallback(async () => {
    if (!auth.isFullyAuthorized || auth.loading || !auth.isMasterAdmin) {
      console.log('🔒 [AdminUsers] Waiting for master admin verification before loading users')
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('👥 [AdminUsers] Loading users...')

      // Get all admin users - simplified query without joins
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [AdminUsers] Error loading users:', error)
        setError(`Failed to load users: ${error.message}`)
        return
      }

      console.log('🔍 [AdminUsers] Raw data received:', data)

      // Transform the data to match our expected format
      const transformedUsers = (data || []).map(adminUser => ({
        user_id: adminUser.user_id,
        email: adminUser.email,
        role: adminUser.role,
        full_name: undefined, // We don't have this in our current schema
        created_at: adminUser.created_at,
        updated_at: adminUser.updated_at,
        is_active: adminUser.is_active
      }))

      setUsers(transformedUsers)
      console.log('✅ [AdminUsers] Users loaded:', transformedUsers.length)
    } catch (error) {
      console.error('❌ [AdminUsers] Unexpected error loading users:', error)
      setError(`Failed to load users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [auth.isFullyAuthorized, auth.loading, auth.isMasterAdmin, supabase])

  // Load data when auth is ready
  useEffect(() => {
    console.log('🔍 [AdminUsers] Auth state changed:', {
      isFullyAuthorized: auth.isFullyAuthorized,
      loading: auth.loading,
      isMasterAdmin: auth.isMasterAdmin,
      isAdmin: auth.isAdmin,
      user: auth.user?.email
    })
    
    if (auth.isFullyAuthorized && !auth.loading && auth.isMasterAdmin) {
      console.log('✅ [AdminUsers] Conditions met, loading users...')
      loadUsers()
    } else {
      console.log('⏳ [AdminUsers] Waiting for proper authorization...')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isFullyAuthorized, auth.loading, auth.isMasterAdmin, loadUsers])

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchQuery || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = filterRole === 'all' || user.role === filterRole
      
      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, filterRole])

  // Add admin
  const handleAddAdmin = async () => {
    if (!auth.isFullyAuthorized || !auth.isMasterAdmin) {
      console.error('❌ [AdminUsers] Not authorized for admin operations')
      setError('Not authorized to perform this action')
      return
    }

    if (!newAdminEmail.trim()) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setIsAddingAdmin(true)
      setError(null)
      console.log('👑 [AdminUsers] Adding admin:', newAdminEmail)

      const email = newAdminEmail.trim().toLowerCase()

      // Check if user is already an admin first
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('email', email)
        .single()

      if (existingAdmin) {
        setError('User is already an admin')
        return
      }

      // For now, we'll create the admin record without checking auth.users
      // The user_id will need to be updated when they first log in
      // This is a simplified approach that assumes the email exists
      
      // Generate a temporary UUID for the user_id (this will be updated when they log in)
      const tempUserId = crypto.randomUUID()

      // Add user as admin
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          user_id: tempUserId, // Temporary - will be updated on first login
          email: email,
          role: 'admin',
          is_active: true
        })

      if (insertError) {
        console.error('❌ [AdminUsers] Error adding admin:', insertError)
        setError(`Failed to add admin: ${insertError.message}`)
        return
      }

      console.log('✅ [AdminUsers] Admin added successfully')
      setNewAdminEmail('')
      await loadUsers()
      
    } catch (error) {
      console.error('❌ [AdminUsers] Unexpected error adding admin:', error)
      setError(`Failed to add admin user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsAddingAdmin(false)
    }
  }

  // Remove admin
  const handleRemoveAdmin = async (userId: string) => {
    if (!auth.isFullyAuthorized || !auth.isMasterAdmin) {
      console.error('❌ [AdminUsers] Not authorized for admin operations')
      setError('Not authorized to perform this action')
      return
    }

    try {
      setProcessing(prev => new Set(prev).add(userId))
      setError(null)
      console.log('👥 [AdminUsers] Removing admin privileges:', userId)

      // Remove from admin_users table
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('user_id', userId)

      if (error) {
        console.error('❌ [AdminUsers] Error removing admin:', error)
        throw error
      }

      console.log('✅ [AdminUsers] Admin privileges removed successfully')
      await loadUsers()
      
    } catch (error) {
      console.error('❌ [AdminUsers] Unexpected error removing admin:', error)
      setError('Failed to remove admin privileges')
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'master_admin':
        return 'default' as const
      case 'admin':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'master_admin':
        return 'Master Admin'
      case 'admin':
        return 'Admin'
      default:
        return 'User'
    }
  }

  return (
    <RobustAdminLayout 
      title="User Management" 
      description="Manage users and admin privileges (Master Admin Only)"
      requireMasterAdmin={true}
    >
      {/* Debug Panel */}
      <AdminDebug />
      
      {/* Admin Users Specific Debug */}
      <AdminUsersDebug />
      
      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
            <Button 
              variant="link" 
              onClick={() => setError(null)}
              className="ml-2 text-red-600 p-0 h-auto"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Master Admin Controls */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Crown className="w-5 h-5" />
            Master Admin Controls
          </CardTitle>
          <CardDescription className="text-purple-700">
            Add new admin users and manage permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email to add as admin"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1"
              type="email"
            />
            <Button
              onClick={handleAddAdmin}
              disabled={isAddingAdmin || !newAdminEmail.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAddingAdmin ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Admin
                </>
              )}
            </Button>
          </div>
          <div className="text-sm text-purple-700">
            ⚠️ Only add trusted users as admins. They will have access to manage products and categories.
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <Input
                id="search"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="sm:w-48">
              <Label htmlFor="filter">Filter by Role</Label>
              <Select value={filterRole} onValueChange={(value: 'all' | 'admin' | 'master_admin') => setFilterRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="master_admin">Master Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={loadUsers}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filterRole !== 'all' ? 'No Users Match Filters' : 'No Users Found'}
              </h3>
              <p className="text-sm">
                {searchQuery || filterRole !== 'all' 
                  ? 'Try adjusting your search criteria'
                  : 'Users will appear here as they register'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.user_id} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{user.email}</h3>
                        {user.full_name && (
                          <p className="text-gray-600">{user.full_name}</p>
                        )}
                      </div>
                      <Badge variant={getRoleBadgeVariant(user.role)} className="ml-auto sm:ml-0">
                        {user.role === 'master_admin' && <Crown className="w-3 h-3 mr-1" />}
                        {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>User ID: {user.user_id}</div>
                      {user.created_at && (
                        <div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:w-auto w-full">
                    {user.role === 'admin' && user.user_id !== auth.user?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={processing.has(user.user_id)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            {processing.has(user.user_id) ? 'Processing...' : 'Remove Admin'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Admin Privileges</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove admin privileges from {user.email}? 
                              They will become a regular user and lose access to admin features.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveAdmin(user.user_id)}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              Remove Admin
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    {user.user_id === auth.user?.id && (
                      <Badge variant="outline" className="self-start">
                        You
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <Card className="mt-6 bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="text-center text-sm text-amber-800">
            <strong>Total Admin Users:</strong> {users.length} | 
            <strong className="ml-2">Master Admins:</strong> {users.filter(u => u.role === 'master_admin').length} |
            <strong className="ml-2">Regular Admins:</strong> {users.filter(u => u.role === 'admin').length}
          </div>
        </CardContent>
      </Card>
    </RobustAdminLayout>
  )
}
