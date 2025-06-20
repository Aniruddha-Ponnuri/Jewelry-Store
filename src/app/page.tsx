import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types/database'
import ProductCard from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Sparkles, Shield, Truck, Heart } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  
  // Fetch featured products with error handling
  const { data: featuredProducts, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_in_stock', true)
    .order('created_at', { ascending: false })
    .limit(6)

  // Handle error silently for production, you can add proper error handling here

  const categories = [
    { name: 'Rings', emoji: '💍', href: '/products?category=rings' },
    { name: 'Necklaces', emoji: '📿', href: '/products?category=necklaces' },
    { name: 'Earrings', emoji: '👂', href: '/products?category=earrings' },
    { name: 'Bracelets', emoji: '💎', href: '/products?category=bracelets' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-amber-50 to-orange-100 py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Silver Jewelry Collection
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Discover timeless elegance with our handcrafted silver jewelry pieces, 
            made with the finest materials and traditional Indian craftsmanship.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/products">
                <Sparkles className="mr-2 h-5 w-5" />
                Shop Collection
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/products?category=rings">
                View Rings
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Silver Jewelry?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Quality Assurance</h3>
                <p className="text-gray-600">Every piece comes with hallmark certification and quality guarantee with free maintenance.</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Truck className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Free Delivery</h3>
                <p className="text-gray-600">Complimentary shipping across India with secure, insured delivery to your doorstep.</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Heart className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Handcrafted Quality</h3>
                <p className="text-gray-600">Each piece is meticulously handcrafted by skilled Indian artisans using premium silver.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section> */}

      {/* Categories Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.name} href={category.href}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">{category.emoji}</div>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && !error && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover our most popular and newest jewelry pieces, carefully selected for their exceptional beauty and craftsmanship.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product: Product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Button size="lg" asChild>
                <Link href="/products">
                  View All Products
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
