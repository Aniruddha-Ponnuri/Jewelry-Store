'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">Manage your jewelry inventory</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update the product information below.' : 'Fill in the product details below.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Product Image</Label>
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
                  />
                  {uploading && <p className="text-sm text-muted-foreground">Uploading image...</p>}
                  
                  {/* Show current image if editing */}
                  {editingProduct?.image_path && !imageFile && (
                    <div className="mt-2">
                      <Image 
                        src={getPublicImageUrl(editingProduct.image_path) || '/placeholder-jewelry.jpg'}
                        alt="Current product image" 
                        width={128}
                        height={128}
                        className="object-cover rounded-md"
                      />
                      <p className="text-sm text-muted-foreground mt-1">Current image</p>
                    </div>
                  )}
                  
                  {/* Show new image preview */}
                  {imageFile && (
                    <div className="mt-2">
                      <Image 
                        src={URL.createObjectURL(imageFile)}
                        alt="New product image preview" 
                        width={128}
                        height={128}
                        className="object-cover rounded-md"
                      />
                      <p className="text-sm text-muted-foreground mt-1">New image preview</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rings">Rings</SelectItem>
                      <SelectItem value="necklaces">Necklaces</SelectItem>
                      <SelectItem value="earrings">Earrings</SelectItem>
                      <SelectItem value="bracelets">Bracelets</SelectItem>
                      <SelectItem value="watches">Watches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Select value={formData.material} onValueChange={(value) => setFormData({ ...formData, material: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="titanium">Titanium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (grams)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gemstone">Gemstone</Label>
                  <Input
                    id="gemstone"
                    value={formData.gemstone}
                    onChange={(e) => setFormData({ ...formData, gemstone: e.target.value })}
                    placeholder="e.g., Diamond, Ruby"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="in-stock"
                  checked={formData.is_in_stock}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_in_stock: checked })}
                />
                <Label htmlFor="in-stock">In Stock</Label>
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
                <Button type="submit" disabled={loading || uploading}>
                  {loading || uploading ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {products.map((product) => (
          <Card key={product.product_id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  {product.image_path && (
                    <Image 
                      src={getPublicImageUrl(product.image_path) || '/placeholder-jewelry.jpg'}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="object-cover rounded-md"
                    />
                  )}
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {product.name}
                      {!product.is_in_stock && (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>₹{product.price}</CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(product)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteProduct(product.product_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
              <div className="flex gap-4 text-sm">
                <span><strong>Category:</strong> {product.category}</span>
                <span><strong>Material:</strong> {product.material}</span>
                {product.weight && <span><strong>Weight:</strong> {product.weight}g</span>}
                {product.gemstone && <span><strong>Gemstone:</strong> {product.gemstone}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
