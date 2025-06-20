'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, Youtube, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-3 sm:px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">💎</span>
              </div>              <h3 className="font-bold text-xl text-amber-400">SilverPalace</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Discover exquisite handcrafted silver jewelry that combines traditional artistry with modern design. 
              Each piece tells a story of elegance and sophistication.
            </p>
            <div className="flex space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                className="p-2 hover:bg-amber-600 hover:text-white transition-all duration-200 rounded-full"
                asChild
              >
                <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="p-2 hover:bg-amber-600 hover:text-white transition-all duration-200 rounded-full"
                asChild
              >
                <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="p-2 hover:bg-amber-600 hover:text-white transition-all duration-200 rounded-full"
                asChild
              >
                <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="p-2 hover:bg-amber-600 hover:text-white transition-all duration-200 rounded-full"
                asChild
              >
                <Link href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                  <Youtube className="h-5 w-5" />
                  <span className="sr-only">YouTube</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-amber-400">Quick Links</h3>
            <nav className="space-y-2">
              <Link href="/" className="block text-gray-300 hover:text-amber-400 transition-colors duration-200 text-sm">
                Home
              </Link>
              <Link href="/products" className="block text-gray-300 hover:text-amber-400 transition-colors duration-200 text-sm">
                All Products
              </Link>
              <Link href="/products?category=rings" className="block text-gray-300 hover:text-amber-400 transition-colors duration-200 text-sm">
                Rings
              </Link>
              <Link href="/products?category=necklaces" className="block text-gray-300 hover:text-amber-400 transition-colors duration-200 text-sm">
                Necklaces
              </Link>
              <Link href="/products?category=earrings" className="block text-gray-300 hover:text-amber-400 transition-colors duration-200 text-sm">
                Earrings
              </Link>
              <Link href="/products?category=bracelets" className="block text-gray-300 hover:text-amber-400 transition-colors duration-200 text-sm">
                Bracelets
              </Link>
              <Link href="/bookmarks" className="block text-gray-300 hover:text-amber-400 transition-colors duration-200 text-sm">
                My Bookmarks
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-amber-400">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <p>123 Jewelry District</p>
                  <p>Mumbai, Maharashtra 400001</p>
                  <p>India</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <a href="tel:+911234567890" className="hover:text-amber-400 transition-colors duration-200">
                    +91 12345 67890
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-amber-400 flex-shrink-0" />                <div className="text-sm text-gray-300">
                  <a href="mailto:contact@silverpalace.com" className="hover:text-amber-400 transition-colors duration-200">
                    contact@silverpalace.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-amber-400">Business Hours</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Monday - Friday:</span>
                <span>9:00 AM - 8:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday:</span>
                <span>10:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday:</span>
                <span>11:00 AM - 5:00 PM</span>
              </div>
            </div>
            <div className="pt-4">
              <h4 className="font-medium text-amber-400 mb-2">Customer Support</h4>
              <p className="text-gray-300 text-sm">
                24/7 online support available via email
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-gray-400 text-sm text-center sm:text-left">
              © 2025 SilverPalace. All rights reserved. | Made with <Heart className="inline h-4 w-4 text-red-500 mx-1" /> for jewelry enthusiasts
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end gap-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">
                Terms of Service
              </Link>
              <Link href="/shipping" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">
                Shipping Info
              </Link>
              <Link href="/returns" className="text-gray-400 hover:text-amber-400 transition-colors duration-200">
                Returns
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
