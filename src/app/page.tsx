'use client'
import { useState, useEffect } from 'react';
import { getFeaturedProducts, getProducts } from '@/lib/supabase/products';
import { Product } from '@/types/product';
import ProductCard from '@/components/ProductCard';
import Hero from '@/components/Hero';
import Image from 'next/image';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [featured, all] = await Promise.all([
          getFeaturedProducts(),
          getProducts()
        ]);
        setFeaturedProducts(featured);
        setAllProducts(all);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = ['all', 'rings', 'necklaces', 'earrings', 'bracelets', 'watches'];
  
  const filteredProducts = selectedCategory === 'all' 
    ? allProducts 
    : allProducts.filter(product => product.category.toLowerCase() === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="hero-gradient py-20 lg:py-32">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Exquisite
                <span className="block text-gold-600">Jewelry</span>
                Collection
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed">
                Discover timeless elegance with our curated selection of premium jewelry. 
                Each piece tells a story of exceptional craftsmanship and luxury.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="btn-primary text-lg px-8 py-4">
                  Explore Collection
                </button>
                <button className="btn-secondary text-lg px-8 py-4">
                  View Catalog
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop"
                  alt="Luxury Jewelry"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gold-400 rounded-full opacity-20"></div>
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-gold-500 rounded-full opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-20">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Featured Collection
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Handpicked pieces that showcase the pinnacle of our craftsmanship
              </p>
            </div>
            <div className="grid-responsive">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Complete Collection
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Browse our entire catalog of exquisite jewelry pieces
            </p>
            
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-gold-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category === 'all' ? 'All Items' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid-responsive">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-gray-500">No products found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Crafted with
                <span className="block text-gold-600">Passion & Precision</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Every piece in our collection is meticulously crafted by master artisans 
                using the finest materials and time-honored techniques. We believe that 
                true luxury lies in the details, and each creation reflects our commitment 
                to excellence.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-600 mb-2">50+</div>
                  <div className="text-gray-600">Years of Excellence</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-600 mb-2">1000+</div>
                  <div className="text-gray-600">Happy Customers</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=400&fit=crop"
                alt="Jewelry Craftsmanship"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
