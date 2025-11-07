import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types/database'
import ProductCard from '@/components/ProductCard'
import CategoryLink from '@/components/CategoryLink'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

// Force dynamic rendering to ensure fresh content after logout
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function FeaturedProducts() {
  try {
    console.log('⭐ [FEATURED PRODUCTS] Starting featured products query...')
    const supabase = await createClient()
    
    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), 3000)
    })
    
    const queryPromise = supabase
      .from('products')
      .select('*')
      .eq('is_in_stock', true)
      .order('created_at', { ascending: false })
      .limit(6)
    
    const { data: featuredProducts, error } = await Promise.race([
      queryPromise,
      timeoutPromise
    ]) as { data: Product[] | null, error: Error | null }

    // Log for debugging - this appears in Vercel logs
    console.log('⭐ [FEATURED PRODUCTS] Query completed:', { 
      count: featuredProducts?.length || 0, 
      hasError: !!error,
      errorMessage: error?.message,
      timestamp: new Date().toISOString()
    })

    if (error) {
      console.error('❌ [FEATURED PRODUCTS] Database error:', {
        message: error.message,
        error: error
      })
    }

    // Show empty state if no products
    if (!featuredProducts || featuredProducts.length === 0) {
      return (
        <section className="py-12 sm:py-16 px-3 sm:px-4 bg-white">
          <div className="container mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-900">
                Featured Products
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {error 
                  ? `Unable to load products: ${error.message}` 
                  : 'No products available at the moment. Check back soon!'}
              </p>
            </div>
            <div className="text-center">
              <Button size="lg" asChild className="touch-target">
                <Link href="/products">Browse All Products</Link>
              </Button>
            </div>
          </div>
        </section>
      )
    }

    return (
      <section className="py-12 sm:py-16 px-3 sm:px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-900">
              Featured Products
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover our most popular and newest jewelry pieces, carefully selected for their exceptional beauty and craftsmanship.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-7">
            {featuredProducts.map((product: Product, index: number) => (
              <ProductCard key={product.product_id} product={product} priority={index < 3} />
            ))}
          </div>
          <div className="text-center mt-8 sm:mt-12">
            <Button size="lg" asChild className="touch-target group">
              <Link href="/products" className="flex items-center justify-center gap-2">
                <span className="text-sm sm:text-base">View All Products</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    )
  } catch (err) {
    console.error('FeaturedProducts error:', err)
    return (
      <section className="py-12 sm:py-16 px-3 sm:px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-900">
              Featured Products
            </h2>
            <p className="text-sm sm:text-base text-red-600 max-w-2xl mx-auto leading-relaxed mb-6">
              Failed to load products. Please try refreshing the page.
            </p>
            <Button size="lg" asChild className="touch-target">
              <Link href="/products">Browse All Products</Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }
}

export default async function HomePage() {
  const supabase = await createClient()
  
  // Fetch categories from Supabase with cache revalidation
  const { data: categoriesFromDB } = await supabase
    .from('categories')
    .select('name, description, emoji, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // Fallback categories if none exist in database
  const fallbackCategories = [
    { name: 'Rings', emoji: '💍', href: '/products?category=rings', dbName: 'rings' },
    { name: 'Necklaces', emoji: '📿', href: '/products?category=necklaces', dbName: 'necklaces' },
    { name: 'Earrings', emoji: '👂', href: '/products?category=earrings', dbName: 'earrings' },
    { name: 'Bracelets', emoji: '💎', href: '/products?category=bracelets', dbName: 'bracelets' },
  ]

  // Use categories from DB if available, otherwise use fallback
  const categories = categoriesFromDB && categoriesFromDB.length > 0 
    ? categoriesFromDB.map(cat => ({
        name: cat.description || cat.name,
        emoji: cat.emoji || getEmojiForCategory(cat.name),
        href: `/products?category=${cat.name.toLowerCase()}`,
        dbName: cat.name // Store original DB name for logging
      }))
    : fallbackCategories

  console.log('🏠 [HOME PAGE] Categories loaded:', {
    source: categoriesFromDB && categoriesFromDB.length > 0 ? 'database' : 'fallback',
    count: categories.length,
    categories: categories.map(c => c.name),
    timestamp: new Date().toISOString()
  })

  // Pick a single random category for consistent UX in the hero buttons
  const randomCategory = categories[Math.floor(Math.random() * categories.length)]

  // Helper function to get emoji for category
  function getEmojiForCategory(categoryName: string): string {
    const emojiMap: { [key: string]: string } = {
      'rings': '💍',
      'necklaces': '📿',
      'earrings': '👂',
      'bracelets': '💎',
      'pendants': '🔗',
      'chains': '⛓️',
    }
    return emojiMap[categoryName.toLowerCase()] || '💎'
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 py-12 sm:py-16 lg:py-20 px-3 sm:px-4 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500 to-transparent transform -skew-y-12 scale-150"></div>
        </div>
          <div className="container mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            SilverPalace Collection
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed">
            Discover timeless elegance with our handcrafted silver jewelry pieces, 
            made with the finest materials and traditional Indian craftsmanship.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Button size="lg" asChild className="touch-target group">
              <Link href="/products" className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:scale-110" />
                <span className="text-sm sm:text-base">Shop Collection</span>
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="touch-target">
              <Link href={`/products?category=${randomCategory.name.toLowerCase()}`} className="flex items-center justify-center">
              <span className="text-sm sm:text-base">View {randomCategory.name}</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16 px-3 sm:px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-900">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((category) => (
              <CategoryLink 
                key={category.name} 
                name={category.name}
                emoji={category.emoji}
                href={category.href}
                dbName={category.dbName}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - with error boundary */}
      <FeaturedProducts />
    </div>
  )
}
