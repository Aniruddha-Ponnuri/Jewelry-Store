'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRobustAuth } from '@/hooks/useRobustAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react'
import RobustAdminLayout from '@/components/RobustAdminLayout'

interface Category {
  category_id: string
  name: string
  description: string | null
  emoji: string | null
  created_at: string
}

export default function AdminCategories() {
  const auth = useRobustAuth({
    requireAuth: true,
    requireAdmin: true,
    redirectOnFail: '/',
    refreshInterval: 60000
  })
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emoji: ''
  })

  // Load categories
  const loadCategories = useCallback(async () => {
    if (!auth.isFullyAuthorized || auth.loading) {
      console.log('🔒 [ADMIN CATEGORIES] Waiting for auth verification before loading categories')
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('📂 [ADMIN CATEGORIES] Loading categories...')

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [ADMIN CATEGORIES] Error loading categories:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        setError('Failed to load categories. Please refresh and try again.')
        return
      }

      setCategories(data || [])
      console.log('✅ [ADMIN CATEGORIES] Categories loaded successfully:', data?.length || 0, 'categories')
    } catch (error) {
      console.error('❌ [ADMIN CATEGORIES] Unexpected error loading categories:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      setError('Failed to load categories. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }, [auth.isFullyAuthorized, auth.loading, supabase])

  // Load data when auth is ready
  useEffect(() => {
    if (auth.isFullyAuthorized && !auth.loading) {
      loadCategories()
    }
  }, [auth.isFullyAuthorized, auth.loading, loadCategories])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!auth.isFullyAuthorized) {
      console.error('❌ [AdminCategories] Not authorized for category operations')
      setError('Not authorized to perform this action')
      return
    }

    try {
      setError(null)
      console.log('💾 [AdminCategories] Submitting category form...')

      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        emoji: formData.emoji.trim() || null
      }

      let result
      if (editingCategory) {
        console.log('✏️ [AdminCategories] Updating category:', editingCategory.category_id)
        result = await supabase
          .from('categories')
          .update(categoryData)
          .eq('category_id', editingCategory.category_id)
          .select()
      } else {
        console.log('➕ [AdminCategories] Creating new category')
        result = await supabase
          .from('categories')
          .insert([categoryData])
          .select()
      }

      if (result.error) {
        console.error('❌ [AdminCategories] Database error:', result.error)
        throw result.error
      }

      console.log('✅ [AdminCategories] Category saved successfully')
      
      // Reset form and refresh data
      resetForm()
      setIsDialogOpen(false)
      await loadCategories()
      
    } catch (error) {
      console.error('❌ [AdminCategories] Unexpected error saving category:', error)
      setError('Failed to save category')
    }
  }

  // Handle deletion
  const handleDelete = async (categoryId: string) => {
    if (!auth.isFullyAuthorized) {
      console.error('❌ [AdminCategories] Not authorized for deletion')
      setError('Not authorized to perform this action')
      return
    }

    try {
      setDeleting(prev => new Set(prev).add(categoryId))
      setError(null)
      console.log('🗑️ [AdminCategories] Deleting category:', categoryId)

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('category_id', categoryId)

      if (error) {
        console.error('❌ [AdminCategories] Delete error:', error)
        throw error
      }

      console.log('✅ [AdminCategories] Category deleted successfully')
      await loadCategories()
      
    } catch (error) {
      // Properly handle and log category deletion errors
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error,
        errorType: typeof error,
        categoryId: categoryId,
        timestamp: new Date().toISOString()
      }
      
      console.error('❌ [AdminCategories] Unexpected error deleting category:', errorDetails)
      
      if (error instanceof Error) {
        setError(`Failed to delete category: ${error.message}`)
      } else {
        setError('Failed to delete category')
      }
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev)
        newSet.delete(categoryId)
        return newSet
      })
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      emoji: ''
    })
    setEditingCategory(null)
  }

  // Edit category
  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      emoji: category.emoji || ''
    })
    setIsDialogOpen(true)
  }

  return (
    <RobustAdminLayout 
      title="Category Management" 
      description="Organize your jewelry products with categories"
    >
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

      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
          <p className="text-gray-600">Organize your jewelry collection</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Update category information' : 'Create a new product category'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Rings, Necklaces, Earrings"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emoji">Emoji</Label>
                <Input
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                  placeholder="💍 (optional)"
                  maxLength={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of this category..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.name}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500 mb-4">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Categories Found</h3>
              <p className="text-sm">Start by creating your first product category.</p>
            </div>
            <Button 
              onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.category_id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category.emoji && <span className="text-2xl">{category.emoji}</span>}
                  <span className="capitalize">{category.name}</span>
                </CardTitle>
                <CardDescription>
                  {category.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(category)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleting.has(category.category_id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleting.has(category.category_id) ? (
                          'Deleting...'
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{category.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(category.category_id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Category
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  Created: {new Date(category.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </RobustAdminLayout>
  )
}
