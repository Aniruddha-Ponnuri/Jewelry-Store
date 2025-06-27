'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import AdminLayout from '@/components/AdminLayout'

interface Category {
  category_id: string
  name: string
  description: string | null
  emoji: string | null
  created_at: string
}

export default function AdminCategories() {
  const { isAdmin, loading: authLoading } = useAdmin()
  const { refreshAdminStatus } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const supabase = createClient()

  // Category form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emoji: ''
  })

  // Check admin status from database instead of environment variable

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      window.location.href = '/'
    }
  }, [isAdmin, authLoading])
  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }, [supabase])
  useEffect(() => {
    if (isAdmin) {
      fetchCategories()
    }
  }, [isAdmin, fetchCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const categoryData = {
        name: formData.name.toLowerCase(),
        description: formData.description || null,
        emoji: formData.emoji || null
      }

      let result
      if (editingCategory) {
        result = await supabase
          .from('categories')
          .update(categoryData)
          .eq('category_id', editingCategory.category_id)
      } else {
        result = await supabase
          .from('categories')
          .insert([categoryData])
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        setIsDialogOpen(false)
        resetForm()
        fetchCategories()
        // Refresh admin status to prevent losing privileges
        setTimeout(() => {
          refreshAdminStatus()
        }, 500)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will affect all products in this category.')) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('category_id', categoryId)

        if (error) throw error
        
        fetchCategories()
        // Refresh admin status to prevent losing privileges
        setTimeout(() => {
          refreshAdminStatus()
        }, 500)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Deletion failed')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      emoji: ''
    })
    setEditingCategory(null)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      emoji: category.emoji || ''
    })
    setIsDialogOpen(true)
  }
  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Access Denied</div>
  }

  return (
    <AdminLayout 
      title="Category Management" 
      description="Manage product categories"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 lg:mb-8 gap-3 sm:gap-4"><Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>          <DialogContent className="w-[95vw] sm:max-w-[500px] mx-auto bg-white border shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingCategory ? 'Update the category information below.' : 'Fill in the category details below.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., rings, necklaces, earrings"
                  required
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emoji" className="text-sm">Emoji (Optional)</Label>
                <Input
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="💍"
                  maxLength={2}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                  className="text-sm"
                />
              </div>              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:gap-6">
        {categories.map((category) => (
          <Card key={category.category_id}>
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-xl sm:text-2xl flex-shrink-0">{category.emoji || '📂'}</div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="capitalize text-base sm:text-lg truncate">{category.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm line-clamp-2">{category.description || 'No description'}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col lg:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(category)}
                    className="flex-1 sm:flex-initial text-xs"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-0 lg:mr-1" />
                    <span className="sm:hidden lg:inline">Edit</span>
                  </Button>                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCategory(category.category_id)}
                    className="flex-1 sm:flex-initial text-xs admin-delete-button"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-0 lg:mr-1" />
                    <span className="sm:hidden lg:inline">Delete</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}

        {categories.length === 0 && (          <Card>
            <CardContent className="text-center py-6 sm:py-8">
              <p className="text-muted-foreground text-sm sm:text-base">No categories yet. Add your first category to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
