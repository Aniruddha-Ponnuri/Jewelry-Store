'use client'

import { useState, useEffect, useCallback } from 'react'
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

interface Category {
  category_id: string
  name: string
  description: string | null
  emoji: string | null
  created_at: string
}

export default function AdminCategories() {
  const { user, loading: authLoading } = useAuth()
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

  // Check if user is admin
  const isAdmin = !authLoading && user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground">Manage product categories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Update the category information below.' : 'Fill in the category details below.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., rings, necklaces, earrings"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emoji">Emoji (Optional)</Label>
                <Input
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="💍"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {categories.map((category) => (
          <Card key={category.category_id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{category.emoji || '📂'}</div>
                  <div>
                    <CardTitle className="capitalize">{category.name}</CardTitle>
                    <CardDescription>{category.description || 'No description'}</CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCategory(category.category_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}

        {categories.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No categories yet. Add your first category to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
