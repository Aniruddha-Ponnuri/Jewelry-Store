'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRobustAuth } from '@/hooks/useRobustAuth'
import { createClient } from '@/lib/supabase/client'
import { Product, Category } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import RobustAdminLayout from '@/components/RobustAdminLayout'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Upload, Package } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { v4 as uuidv4 } from 'uuid'
import { getPublicImageUrl } from '@/lib/utils'
import Image from 'next/image'

export default function RobustAdminProducts() {
  const auth = useRobustAuth({
    requireAuth: true,
    requireAdmin: true,
    redirectOnFail: '/',
    refreshInterval: 60000
  })
  
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

  // Product form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'rings',
    material: 'silver',
    weight: '',
    gemstone: '',
    is_in_stock: true,
    image_path: ''
  })

  // Load categories
  const loadCategories = useCallback(async () => {
    if (!auth.isFullyAuthorized || auth.loading) {
      return
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading categories:', error)
        setError('Failed to load categories')
        return
      }

      setCategories(data || [])
      
      // Set default category if categories exist
      if (data && data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: data[0].name.toLowerCase() }))
      }
    } catch (error) {
      console.error('Unexpected error loading categories:', error)
      setError('Failed to load categories')
    }
  }, [auth.isFullyAuthorized, auth.loading, supabase, formData.category])

  // Load products
  const loadProducts = useCallback(async () => {
    if (!auth.isFullyAuthorized || auth.loading) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading products:', error)
        setError('Failed to load products')
        return
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Unexpected error loading products:', error)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [auth.isFullyAuthorized, auth.loading, supabase])

  // Load data when auth is ready
  useEffect(() => {
    if (auth.isFullyAuthorized && !auth.loading) {
      loadCategories()
      loadProducts()
    }
  }, [auth.isFullyAuthorized, auth.loading, loadCategories, loadProducts])

  // Handle image upload
  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!auth.isFullyAuthorized) {
      console.error('Not authorized for image upload')
      return null
    }

    try {
      setUploading(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Image upload error:', uploadError)
        throw uploadError
      }

      return filePath
    } catch (error) {
      console.error('Unexpected error uploading image:', error)
      setError('Failed to upload image')
      return null
    } finally {
      setUploading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!auth.isFullyAuthorized) {
      console.error('❌ [AdminProducts] Not authorized for product operations')
      setError('Not authorized to perform this action')
      return
    }

    try {
      setUploading(true)
      setError(null)

      let imagePath = formData.image_path

      // Upload image if selected
      if (imageFile) {
        const uploadedPath = await handleImageUpload(imageFile)
        if (!uploadedPath) {
          setError('Failed to upload image')
          return
        }
        imagePath = uploadedPath
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        material: formData.material,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        gemstone: formData.gemstone.trim() || null,
        is_in_stock: formData.is_in_stock,
        image_path: imagePath || null
      }

      let result
      if (editingProduct) {
        result = await supabase
          .from('products')
          .update(productData)
          .eq('product_id', editingProduct.product_id)
          .select()
      } else {
        result = await supabase
          .from('products')
          .insert([productData])
          .select()
      }

      if (result.error) {
        console.error('Database error:', result.error)
        throw result.error
      }
      
      // Reset form and refresh data
      resetForm()
      setIsDialogOpen(false)
      await loadProducts()
      
    } catch (error) {
      console.error('❌ [AdminProducts] Unexpected error saving product:', error)
      setError('Failed to save product')
    } finally {
      setUploading(false)
    }
  }

  // Handle product deletion with robust error handling
  const handleDelete = async (productId: string) => {
    if (!auth.isFullyAuthorized) {
      console.error('Not authorized for deletion')
      setError('Not authorized to perform this action')
      return
    }

    try {
      setDeletingProducts(prev => new Set(prev).add(productId))
      setError(null)

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('product_id', productId)

      if (error) {
        console.error('Delete error:', error)
        throw error
      }

      await loadProducts()
      
    } catch (error) {
      console.error('Unexpected error deleting product:', error)
      setError('Failed to delete product')
    } finally {
      setDeletingProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: categories.length > 0 ? categories[0].name.toLowerCase() : 'rings',
      material: 'silver',
      weight: '',
      gemstone: '',
      is_in_stock: true,
      image_path: ''
    })
    setEditingProduct(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Edit product
  const handleEdit = (product: Product) => {
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
      image_path: product.image_path || ''
    })
    setIsDialogOpen(true)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  return (
    <RobustAdminLayout 
      title="Product Management" 
      description="Manage your jewelry products and inventory"
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
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-600">Manage your jewelry collection</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information' : 'Create a new jewelry product'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Silver Diamond Ring"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed product description..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.category_id} value={category.name.toLowerCase()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="material">Material *</Label>
                  <Select 
                    value={formData.material} 
                    onValueChange={(value) => setFormData({...formData, material: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="mixed">Mixed Metal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (grams)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gemstone">Gemstone</Label>
                  <Input
                    id="gemstone"
                    value={formData.gemstone}
                    onChange={(e) => setFormData({...formData, gemstone: e.target.value})}
                    placeholder="e.g., Diamond, Ruby, Emerald"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stock">In Stock</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="stock"
                      checked={formData.is_in_stock}
                      onCheckedChange={(checked) => setFormData({...formData, is_in_stock: checked})}
                    />
                    <Label htmlFor="stock" className="text-sm">
                      {formData.is_in_stock ? 'Available' : 'Out of Stock'}
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
                {imageFile && (
                  <p className="text-sm text-gray-600">Selected: {imageFile.name}</p>
                )}
                {formData.image_path && !imageFile && (
                  <p className="text-sm text-green-600">Current image: {formData.image_path}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading || !formData.name || !formData.price}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {uploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      {editingProduct ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingProduct ? 'Update Product' : 'Create Product'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500 mb-4">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
              <p className="text-sm">Start by adding your first jewelry product to the inventory.</p>
            </div>
            <Button 
              onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.product_id} className="hover:shadow-lg transition-shadow duration-200 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description || 'No description available'}
                    </CardDescription>
                  </div>
                  <Badge variant={product.is_in_stock ? "default" : "destructive"} className="ml-2">
                    {product.is_in_stock ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Product Image */}
                {product.image_path ? (
                  <div className="relative h-48 w-full bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={getPublicImageUrl(product.image_path) || '/placeholder.jpg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-gray-400 text-center">
                      <Package className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No Image</p>
                    </div>
                  </div>
                )}
                
                {/* Product Details */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg text-amber-600">
                      {formatCurrency(product.price)}
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {product.category}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Material:</span>
                      <span className="capitalize font-medium">{product.material}</span>
                    </div>
                    {product.weight && (
                      <div className="flex justify-between">
                        <span>Weight:</span>
                        <span className="font-medium">{product.weight}g</span>
                      </div>
                    )}
                    {product.gemstone && (
                      <div className="flex justify-between">
                        <span>Gemstone:</span>
                        <span className="font-medium">{product.gemstone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
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
                        disabled={deletingProducts.has(product.product_id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingProducts.has(product.product_id) ? (
                          <>
                            <Upload className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
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
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{product.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(product.product_id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Product
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </RobustAdminLayout>
  )
}
