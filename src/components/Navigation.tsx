'use client'
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isAdmin = (user: any) => {
    if (!user?.email) return false;
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    return adminEmails.includes(user.email);
  };

  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="container-custom flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gold-500">
          Jewelry Showcase
        </Link>
        <div className="hidden md:flex space-x-6">
          <Link href="/" className="hover:text-gold-400 transition-colors">
            Home
          </Link>
          <Link href="/products" className="hover:text-gold-400 transition-colors">
            Products
          </Link>          {user ? (
            <>
              {isAdmin(user) && (
                <Link href="/admin" className="hover:text-gold-400 transition-colors">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="hover:text-gold-400 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="hover:text-gold-400 transition-colors">
              Login
            </Link>
          )}
        </div>
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>
      {isOpen && (
        <div className="md:hidden mt-2 space-y-2">
          <Link href="/" className="block hover:text-gold-400 transition-colors p-2">
            Home
          </Link>
          <Link href="/products" className="block hover:text-gold-400 transition-colors p-2">
            Products
          </Link>          {user ? (
            <>
              {isAdmin(user) && (
                <Link href="/admin" className="block hover:text-gold-400 transition-colors p-2">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="block hover:text-gold-400 transition-colors p-2 w-full text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="block hover:text-gold-400 transition-colors p-2">
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
