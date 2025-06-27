'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types/database'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  // Check admin status from database instead of environment variable

  // Product form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'rings',
    material: 'gold',
    weight: '',
    gemstone: '',
    is_in_stock: true
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

  useEffect(() => {
    if (isAdmin) {
      fetchProducts()
    }
  }, [isAdmin, fetchProducts])

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
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // Get product to delete image
        const { data: product } = await supabase
          .from('products')
          .select('image_path')
          .eq('product_id', productId)
          .single()

        // Delete product image if exists
        if (product?.image_path) {
          await supabase.storage
            .from('product_images')
            .remove([product.image_path])
        }

        // Delete product
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('product_id', productId)

        if (error) throw error
        
        fetchProducts()
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Deletion failed')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'rings',
      material: 'gold',
      weight: '',
      gemstone: '',
      is_in_stock: true
    })
    setEditingProduct(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
      is_in_stock: product.is_in_stock
    })
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
    >      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 lg:mb-8 gap-3 sm:gap-4">
        <div className="sm:hidden">
          {/* Mobile spacing placeholder */}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>          <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-auto bg-white border shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingProduct ? 'Update the product information below.' : 'Fill in the product details below.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
                      <SelectItem value="rings" className="admin-select-item">Rings</SelectItem>
                      <SelectItem value="necklaces" className="admin-select-item">Necklaces</SelectItem>
                      <SelectItem value="earrings" className="admin-select-item">Earrings</SelectItem>
                      <SelectItem value="bracelets" className="admin-select-item">Bracelets</SelectItem>
                      <SelectItem value="watches" className="admin-select-item">Watches</SelectItem>
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="in-stock"
                  checked={formData.is_in_stock}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_in_stock: checked })}
                />
                <Label htmlFor="in-stock" className="text-sm">In Stock</Label>
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
                      {!product.is_in_stock && (
                        <Badge variant="destructive" className="text-xs w-fit">Out of Stock</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base font-medium">₹{product.price}</CardDescription>
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
                    className="flex-1 sm:flex-initial text-xs admin-delete-button"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-0 lg:mr-1" />
                    <span className="sm:hidden lg:inline">Delete</span>
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
