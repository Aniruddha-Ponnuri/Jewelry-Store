'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Product, Category } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AdminLayout from '@/components/AdminLayout'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { v4 as uuidv4 } from 'uuid'
import { getPublicImageUrl } from '@/lib/utils'
import Image from 'next/image'

export default function AdminProducts() {
  const { isAdmin, loading: authLoading } = useAdmin()
  const { refreshAdminStatus } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingProducts, setDeletingProducts] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  // Check admin status from database instead of environment variable

  // Product form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'rings', // This will be updated when categories are loaded
    material: 'silver',
    weight: '',
    gemstone: '',
    is_in_stock: true,
    is_featured: false,
    stock_quantity: '0'
  })

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      window.location.href = '/'
    }
  }, [isAdmin, authLoading])

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }, [supabase])

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error.message)
      // Use fallback categories if fetch fails
      setCategories([
        { category_id: '1', name: 'rings', description: 'Rings', emoji: '💍', is_active: true, sort_order: 1, created_at: '', updated_at: '' },
        { category_id: '2', name: 'necklaces', description: 'Necklaces', emoji: '📿', is_active: true, sort_order: 2, created_at: '', updated_at: '' },
        { category_id: '3', name: 'earrings', description: 'Earrings', emoji: '👂', is_active: true, sort_order: 3, created_at: '', updated_at: '' },
        { category_id: '4', name: 'bracelets', description: 'Bracelets', emoji: '📿', is_active: true, sort_order: 4, created_at: '', updated_at: '' },
        { category_id: '5', name: 'watches', description: 'Watches', emoji: '⌚', is_active: true, sort_order: 5, created_at: '', updated_at: '' }
      ])
    } else {
      setCategories(data || [])
    }
  }, [supabase])

  useEffect(() => {
    if (isAdmin) {
      fetchProducts()
      fetchCategories()
    }
  }, [isAdmin, fetchProducts, fetchCategories])

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    const fileName = `${uuidv4()}-${file.name}`
    
    const { data, error } = await supabase.storage
      .from('product_images')
      .upload(fileName, file)

    setUploading(false)
    
    if (error) {
      throw new Error('Image upload failed: ' + error.message)
    }
    
    return data?.path
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imagePath = editingProduct?.image_path

      // Handle image upload/update
      if (imageFile) {
        // Delete old image if editing
        if (editingProduct?.image_path) {
          await supabase.storage
            .from('product_images')
            .remove([editingProduct.image_path])
        }

        imagePath = await handleImageUpload(imageFile)
      }

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category: formData.category,
        material: formData.material,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        gemstone: formData.gemstone || null,
        is_in_stock: formData.is_in_stock,
        is_featured: formData.is_featured || false,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        image_path: imagePath
      }

      let result
      if (editingProduct) {
        result = await supabase
          .from('products')
          .update(productData)
          .eq('product_id', editingProduct.product_id)
      } else {
        result = await supabase
          .from('products')
          .insert([productData])
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        setIsDialogOpen(false)
        resetForm()
        fetchProducts()
        
        // Refresh categories to get latest data
        fetchCategories()
        
        // Force cache revalidation for pages that use categories
        try {
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '/' })
          })
        } catch (revalidateError) {
          console.warn('Cache revalidation failed:', revalidateError)
        }
        
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

  const deleteProduct = async (productId: string) => {
    console.log('Attempting to delete product:', productId)
    
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      // Add product to deleting state
      setDeletingProducts(prev => new Set(prev.add(productId)))
      setError(null)
      
      try {
        // Get product details first to delete image and verify existence
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('product_id, name, image_path')
          .eq('product_id', productId)
          .single()

        if (fetchError) {
          console.error('Error fetching product for deletion:', fetchError)
          throw new Error(`Failed to fetch product: ${fetchError.message}`)
        }

        if (!product) {
          throw new Error('Product not found')
        }

        console.log('Product found for deletion:', product.name)

        // Delete product image if exists
        if (product.image_path) {
          console.log('Deleting product image:', product.image_path)
          const { error: imageError } = await supabase.storage
            .from('product_images')
            .remove([product.image_path])
          
          if (imageError) {
            console.warn('Failed to delete product image:', imageError.message)
            // Continue with product deletion even if image deletion fails
          } else {
            console.log('Product image deleted successfully')
          }
        }

        // Delete product from database
        console.log('Deleting product from database...')
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('product_id', productId)

        if (deleteError) {
          console.error('Error deleting product:', deleteError)
          throw new Error(`Failed to delete product: ${deleteError.message}`)
        }

        console.log('Product deleted successfully')
        
        // Refresh products list
        await fetchProducts()
        
        // Show success message (you can add a toast notification here if available)
        console.log(`Product "${product.name}" deleted successfully`)
        
        // Force cache revalidation
        try {
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '/products' })
          })
        } catch (revalidateError) {
          console.warn('Cache revalidation failed:', revalidateError)
        }
        
        // Refresh admin status to prevent losing privileges
        setTimeout(() => {
          refreshAdminStatus()
        }, 500)
        
      } catch (error) {
        console.error('Delete product error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete product'
        setError(errorMessage)
        alert(`Error: ${errorMessage}`) // Show immediate feedback to user
      } finally {
        // Remove product from deleting state
        setDeletingProducts(prev => {
          const newSet = new Set(prev)
          newSet.delete(productId)
          return newSet
        })
      }
    }
  }

  const resetForm = () => {
    const defaultCategory = categories.length > 0 ? categories[0].name : 'rings'
    setFormData({
      name: '',
      description: '',
      price: '',
      category: defaultCategory,
      material: 'gold',
      weight: '',
      gemstone: '',
      is_in_stock: true,
      is_featured: false,
      stock_quantity: '0'
    })
    setEditingProduct(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Refresh categories when resetting form for new products
    fetchCategories()
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      material: product.material,
      weight: product.weight?.toString() || '',
      gemstone: product.gemstone || '',
      is_in_stock: product.is_in_stock,
      is_featured: product.is_featured || false,
      stock_quantity: (product.stock_quantity || 0).toString()
    })
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Refresh categories when opening the dialog to ensure we have the latest
    fetchCategories()
    
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
      title="Product Management" 
      description="Manage your jewelry inventory"
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 lg:mb-8 gap-3 sm:gap-4">
        <div className="sm:hidden">
          {/* Mobile spacing placeholder */}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>          <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-hidden mx-auto bg-white border shadow-lg flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4">
              <DialogTitle className="text-base sm:text-lg">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingProduct ? 'Update the product information below.' : 'Fill in the product details below.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-1">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="text-sm"
                />
              </div>              <div className="space-y-2">
                <Label className="text-sm">Product Image</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setImageFile(e.target.files[0])
                      }
                    }}
                    disabled={uploading}
                    className="text-sm"
                  />
                  {uploading && <p className="text-xs text-muted-foreground">Uploading image...</p>}
                    {/* Show current image if editing */}
                  {editingProduct?.image_path && !imageFile && (
                    <div className="mt-2">
                      <Image 
                        src={getPublicImageUrl(editingProduct.image_path) || '/placeholder-jewelry.jpg'}
                        alt="Current product image" 
                        width={96}
                        height={96}
                        className="object-cover rounded-md"
                        sizes="96px"
                        priority={false}
                        loading="lazy"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Current image</p>
                    </div>
                  )}
                  
                  {/* Show new image preview */}
                  {imageFile && (
                    <div className="mt-2">
                      <Image 
                        src={URL.createObjectURL(imageFile)}
                        alt="New product image preview" 
                        width={96}
                        height={96}
                        className="object-cover rounded-md"
                        sizes="96px"
                        priority={false}
                        loading="lazy"
                      />
                      <p className="text-xs text-muted-foreground mt-1">New image preview</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="admin-select-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="admin-select-content">
                      {categories.map((category) => (
                        <SelectItem 
                          key={category.category_id} 
                          value={category.name} 
                          className="admin-select-item"
                        >
                          {category.emoji && `${category.emoji} `}{category.description || category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material" className="text-sm">Material</Label>
                  <Select value={formData.material} onValueChange={(value) => setFormData({ ...formData, material: value })}>
                    <SelectTrigger className="admin-select-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="admin-select-content">
                      <SelectItem value="gold" className="admin-select-item">Gold</SelectItem>
                      <SelectItem value="silver" className="admin-select-item">Silver</SelectItem>
                      <SelectItem value="platinum" className="admin-select-item">Platinum</SelectItem>
                      <SelectItem value="titanium" className="admin-select-item">Titanium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm">Weight (grams)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gemstone" className="text-sm">Gemstone</Label>
                  <Input
                    id="gemstone"
                    value={formData.gemstone}
                    onChange={(e) => setFormData({ ...formData, gemstone: e.target.value })}
                    placeholder="e.g., Diamond, Ruby"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity" className="text-sm">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => {
                      const quantity = e.target.value
                      setFormData({ 
                        ...formData, 
                        stock_quantity: quantity,
                        is_in_stock: parseInt(quantity) > 0 
                      })
                    }}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Stock status will automatically update based on quantity
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    className="featured-switch"
                  />
                  <Label htmlFor="featured" className={`text-sm featured-label ${formData.is_featured ? 'featured' : 'not-featured'}`}>
                  {formData.is_featured ? "⭐ Featured Product" : "🔲 Regular Product"}
                </Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="in-stock"
                  checked={formData.is_in_stock}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_in_stock: checked })}
                  className="stock-switch"
                />
                <Label htmlFor="in-stock" className={`text-sm stock-label ${formData.is_in_stock ? 'in-stock' : 'out-of-stock'}`}>
                  {formData.is_in_stock ? "✓ In Stock" : "✗ Out of Stock"}
                </Label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || uploading} className="w-full sm:w-auto">
                  {loading || uploading ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                </Button>
              </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>      <div className="grid gap-3 sm:gap-4 lg:gap-6">
        {products.map((product) => (
          <Card key={product.product_id}>
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">                  {product.image_path && (
                    <Image 
                      src={getPublicImageUrl(product.image_path) || '/placeholder-jewelry.jpg'}
                      alt={product.name}
                      width={60}
                      height={60}
                      className="object-cover rounded-md flex-shrink-0 sm:w-[80px] sm:h-[80px]"
                      sizes="(max-width: 640px) 60px, 80px"
                      priority={false}
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-base sm:text-lg">
                      <span className="truncate">{product.name}</span>
                      <div className="flex gap-1">
                        {!product.is_in_stock && (
                          <Badge variant="destructive" className="text-xs w-fit">Out of Stock</Badge>
                        )}
                        {product.is_featured && (
                          <Badge variant="default" className="text-xs w-fit">Featured</Badge>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base font-medium">
                      ₹{product.price}
                      {product.stock_quantity !== undefined && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          Stock: {product.stock_quantity}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col lg:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(product)}
                    className="flex-1 sm:flex-initial text-xs"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-0 lg:mr-1" />
                    <span className="sm:hidden lg:inline">Edit</span>
                  </Button>                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteProduct(product.product_id)}
                    disabled={deletingProducts.has(product.product_id)}
                    className="flex-1 sm:flex-initial text-xs admin-delete-button"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-0 lg:mr-1" />
                    <span className="sm:hidden lg:inline">
                      {deletingProducts.has(product.product_id) ? 'Deleting...' : 'Delete'}
                    </span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 sm:gap-4 text-xs sm:text-sm">
                <span className="truncate"><strong>Category:</strong> {product.category}</span>
                <span className="truncate"><strong>Material:</strong> {product.material}</span>
                {product.weight && <span className="truncate"><strong>Weight:</strong> {product.weight}g</span>}
                {product.gemstone && <span className="truncate"><strong>Gemstone:</strong> {product.gemstone}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  )
}
