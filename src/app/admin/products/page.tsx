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
      console.log('📂 [ADMIN PRODUCTS] Loading categories...')
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('❌ [ADMIN PRODUCTS] Error loading categories:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        setError('Failed to load categories. Please refresh and try again.')
        return
      }

      console.log('✅ [ADMIN PRODUCTS] Categories loaded successfully:', data?.length || 0, 'categories')
      setCategories(data || [])
      
      // Set default category if categories exist
      if (data && data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: data[0].name.toLowerCase() }))
      }
    } catch (error) {
      // Properly handle and log category loading errors
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error,
        errorType: typeof error,
        timestamp: new Date().toISOString()
      }
      
      console.error('❌ [ADMIN PRODUCTS] Unexpected error loading categories:', errorDetails)
      setError('Failed to load categories. Please refresh and try again.')
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
      console.log('📦 [ADMIN PRODUCTS] Loading products...')

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [ADMIN PRODUCTS] Error loading products:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        setError('Failed to load products. Please refresh and try again.')
        return
      }

      console.log('✅ [ADMIN PRODUCTS] Products loaded successfully:', data?.length || 0, 'products')
      setProducts(data || [])
    } catch (error) {
      // Properly handle and log product loading errors
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error,
        errorType: typeof error,
        timestamp: new Date().toISOString()
      }
      
      console.error('❌ [ADMIN PRODUCTS] Unexpected error loading products:', errorDetails)
      setError('Failed to load products. Please refresh and try again.')
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
      console.error('❌ [IMAGE UPLOAD] Not authorized for image upload')
      setError('Not authorized to upload images')
      return null
    }

    if (!file) {
      console.error('❌ [IMAGE UPLOAD] No file provided')
      setError('No file selected for upload')
      return null
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ [IMAGE UPLOAD] Invalid file type:', file.type)
      setError('Please select a valid image file (JPEG, PNG, or WebP)')
      return null
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      console.error('❌ [IMAGE UPLOAD] File too large:', file.size)
      setError('Image file size must be less than 5MB')
      return null
    }

    try {
      setUploading(true)
      console.log('📤 [IMAGE UPLOAD] Starting upload for file:', file.name, 'Size:', file.size, 'Type:', file.type)

      // Enhanced bucket checking with fallback
      console.log('🗂️ [IMAGE UPLOAD] Checking if images bucket exists...')
      
      let imagesBucketExists = false
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        
        if (bucketsError) {
          console.warn('⚠️ [IMAGE UPLOAD] Bucket listing failed, trying direct upload:', bucketsError.message)
          // Don't fail here - sometimes listBuckets fails but upload still works
          imagesBucketExists = true // Assume bucket exists and try upload
        } else {
          const imagesBucket = buckets?.find(bucket => bucket.name === 'images')
          imagesBucketExists = !!imagesBucket
          
          if (imagesBucket) {
            console.log('✅ [IMAGE UPLOAD] Images bucket found:', imagesBucket)
          } else {
            console.log('📋 [IMAGE UPLOAD] Available buckets:', buckets?.map(b => b.name) || [])
          }
        }
      } catch (listError) {
        console.warn('⚠️ [IMAGE UPLOAD] Bucket check failed, attempting direct upload:', listError)
        imagesBucketExists = true // Try upload anyway
      }
      
      if (!imagesBucketExists) {
        console.error('❌ [IMAGE UPLOAD] Images bucket not found and bucket listing failed')
        setError('Image storage not configured. Please run the storage setup script or contact administrator.')
        return null
      }

      console.log('✅ [IMAGE UPLOAD] Proceeding with upload...')

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `products/${fileName}`

      // Check if session is still valid before upload
      const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession()
      if (sessionCheckError || !session) {
        console.error('❌ [IMAGE UPLOAD] Session invalid before upload:', sessionCheckError?.message)
        setError('Authentication session expired. Please refresh and try again.')
        return null
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ [IMAGE UPLOAD] Supabase upload error:', {
          message: uploadError.message,
          error: uploadError
        })
        
        // Handle specific error types
        if (uploadError.message.includes('The resource already exists')) {
          // Retry with a new filename
          const retryFileName = `${uuidv4()}.${fileExt}`
          const retryFilePath = `products/${retryFileName}`
          
          const { error: retryError } = await supabase.storage
            .from('images')
            .upload(retryFilePath, file, {
              cacheControl: '3600',
              upsert: false
            })
            
          if (retryError) {
            console.error('❌ [IMAGE UPLOAD] Retry upload failed:', retryError)
            setError(`Upload failed: ${retryError.message}`)
            return null
          }
          
          console.log('✅ [IMAGE UPLOAD] Image uploaded successfully on retry:', retryFilePath)
          return retryFilePath
        }
        
        setError(`Upload failed: ${uploadError.message}`)
        return null
      }

      console.log('✅ [IMAGE UPLOAD] Image uploaded successfully:', filePath, 'Data:', uploadData)
      return filePath
    } catch (error) {
      // Properly handle and log errors to prevent empty objects
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error,
        errorType: typeof error,
        timestamp: new Date().toISOString()
      }
      
      console.error('❌ [IMAGE UPLOAD] Unexpected error uploading image:', errorDetails)
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          console.error('Image upload error: Network issue detected')
          setError('Network error during upload. Please check your connection and try again.')
        } else if (error.message.includes('Authentication') || error.message.includes('session')) {
          console.error('Image upload error: Authentication issue detected')
          setError('Authentication error. Please refresh the page and try again.')
        } else {
          console.error(`Image upload error: ${error.message}`)
          setError(`Upload error: ${error.message}`)
        }
      } else {
        console.error('Image upload error: Non-Error object thrown:', String(error))
        setError('An unexpected error occurred during upload. Please try again.')
      }
      return null
    } finally {
      setUploading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!auth.isFullyAuthorized) {
      console.error('❌ [ADMIN PRODUCTS] Not authorized for product operations')
      setError('Not authorized to perform this action')
      return
    }

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Product name is required')
      return
    }
    
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      setError('Valid price is required')
      return
    }

    try {
      setUploading(true)
      setError(null)
      console.log('💾 [ADMIN PRODUCTS] Starting product save operation...')

      let imagePath = formData.image_path

      // Upload image if selected
      if (imageFile) {
        console.log('📤 [ADMIN PRODUCTS] Uploading image before saving product...')
        const uploadedPath = await handleImageUpload(imageFile)
        if (!uploadedPath) {
          // Error is already set in handleImageUpload
          return
        }
        imagePath = uploadedPath
        console.log('✅ [ADMIN PRODUCTS] Image uploaded successfully, path:', uploadedPath)
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

      console.log('💾 [ADMIN PRODUCTS] Saving product data:', {
        operation: editingProduct ? 'UPDATE' : 'INSERT',
        productId: editingProduct?.product_id,
        productName: productData.name
      })

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
        console.error('❌ [ADMIN PRODUCTS] Database error:', {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code
        })
        
        // Handle specific database errors
        if (result.error.code === '23505') {
          setError('A product with this name already exists')
        } else if (result.error.code === '23502') {
          setError('Missing required field information')
        } else {
          setError(`Database error: ${result.error.message}`)
        }
        return
      }
      
      console.log('✅ [ADMIN PRODUCTS] Product saved successfully:', result.data?.[0])
      
      // Reset form and refresh data
      resetForm()
      setIsDialogOpen(false)
      await loadProducts()
      
    } catch (error) {
      // Properly handle and log product save errors
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error,
        errorType: typeof error,
        operation: editingProduct ? 'UPDATE' : 'INSERT',
        productName: formData.name,
        timestamp: new Date().toISOString()
      }
      
      console.error('❌ [ADMIN PRODUCTS] Unexpected error saving product:', errorDetails)
      
      if (error instanceof Error) {
        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          setError('Network error while saving product. Please check your connection and try again.')
        } else if (error.message.includes('Authentication') || error.message.includes('session')) {
          setError('Authentication error. Please refresh the page and try again.')
        } else {
          setError(`Error saving product: ${error.message}`)
        }
      } else {
        setError('An unexpected error occurred while saving the product. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  // Handle product deletion with robust error handling
  const handleDelete = async (productId: string) => {
    if (!auth.isFullyAuthorized) {
      console.error('❌ [ADMIN PRODUCTS] Not authorized for deletion')
      setError('Not authorized to perform this action')
      return
    }

    try {
      setDeletingProducts(prev => new Set(prev).add(productId))
      setError(null)
      console.log('🗑️ [ADMIN PRODUCTS] Starting product deletion for ID:', productId)

      // Check session before deletion
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('❌ [ADMIN PRODUCTS] Session invalid before deletion:', sessionError?.message)
        setError('Authentication session expired. Please refresh and try again.')
        return
      }

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('product_id', productId)

      if (deleteError) {
        console.error('❌ [ADMIN PRODUCTS] Delete error:', {
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint,
          code: deleteError.code
        })
        
        // Handle specific delete errors
        if (deleteError.code === '23503') {
          setError('Cannot delete product: it may be referenced by other records')
        } else {
          setError(`Delete failed: ${deleteError.message}`)
        }
        return
      }

      console.log('✅ [ADMIN PRODUCTS] Product deleted successfully:', productId)
      await loadProducts()
      
    } catch (error) {
      // Properly handle and log product deletion errors
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error,
        errorType: typeof error,
        productId: productId,
        timestamp: new Date().toISOString()
      }
      
      console.error('❌ [ADMIN PRODUCTS] Unexpected error deleting product:', errorDetails)
      
      if (error instanceof Error) {
        if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
          setError('Network error while deleting product. Please check your connection and try again.')
        } else if (error.message.includes('Authentication') || error.message.includes('session')) {
          setError('Authentication error. Please refresh the page and try again.')
        } else {
          setError(`Error deleting product: ${error.message}`)
        }
      } else {
        setError('An unexpected error occurred while deleting the product. Please try again.')
      }
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
