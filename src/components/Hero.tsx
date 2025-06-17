import Image from 'next/image';

export default function Hero() {
  return (
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
  );
}
