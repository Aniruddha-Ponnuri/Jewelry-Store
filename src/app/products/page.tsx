import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types/database'
import ProductCard from '@/components/ProductCard'
import { Suspense } from 'react'

// Loading skeleton component
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const categoryParam = params.category
  const category = typeof categoryParam === 'string' ? categoryParam : undefined

  console.log('🔍 [PRODUCTS PAGE] Loading products with params:', {
    category,
    rawParams: params,
    timestamp: new Date().toISOString()
  })

  const supabase = await createClient()
  
  // Build query with optional category filter
  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  // Apply category filter if present (case-insensitive match)
  if (category) {
    console.log('🏷️ [PRODUCTS PAGE] Filtering by category:', category)
    // Use ilike for case-insensitive matching
    query = query.ilike('category', category)
  } else {
    console.log('📦 [PRODUCTS PAGE] Loading all products (no category filter)')
  }

  const { data: products, error } = await query

  console.log('📊 [PRODUCTS PAGE] Query result:', {
    productsCount: products?.length || 0,
    hasError: !!error,
    errorMessage: error?.message,
    category,
    timestamp: new Date().toISOString()
  })

  if (error) {
    console.error('❌ [PRODUCTS PAGE] Database error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      category
    })
    
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-600 text-sm sm:text-base">Error loading products: {error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  // Get category display name
  const categoryDisplayName = category 
    ? category.charAt(0).toUpperCase() + category.slice(1) 
    : null

  console.log('✅ [PRODUCTS PAGE] Rendering products page:', {
    totalProducts: products?.length || 0,
    category: categoryDisplayName || 'All',
    timestamp: new Date().toISOString()
  })

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
      {/* Header Section */}
      <div className="text-center mb-6 sm:mb-8 lg:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 text-gray-900">
          {categoryDisplayName ? `${categoryDisplayName} Collection` : 'Our Jewelry Collection'}
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
          {categoryDisplayName 
            ? `Browse our exquisite ${categoryDisplayName.toLowerCase()} collection, handcrafted with care.`
            : 'Discover our exquisite range of handcrafted silver jewelry, each piece meticulously crafted with traditional Indian artistry and modern design sensibilities.'
          }
        </p>
      </div>

      {/* Products Grid */}
      <Suspense fallback={<ProductGridSkeleton />}>
        {Array.isArray(products) && products.length > 0 ? (
          <>
            {/* Results Count */}
            <div className="mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-gray-600">
                Showing {products.length} product{products.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {/* Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {products.map((product: Product) => (
                <ProductCard 
                  key={product.product_id} 
                  product={product}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 sm:py-16 lg:py-20">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-4xl sm:text-6xl mb-4">💎</div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
                No products available
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                We&apos;re currently updating our collection. Please check back soon for our latest jewelry pieces.
              </p>
            </div>
          </div>
        )}
      </Suspense>
    </div>
  )
}
