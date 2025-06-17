'use client'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function AdminNavigation() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="bg-gray-800 text-white p-4 lg:p-6 fixed w-full z-10 lg:w-64 lg:h-screen lg:flex lg:flex-col">
      <div className="container-custom lg:flex lg:flex-col lg:h-full">
        <div className="flex justify-between items-center lg:block">
          <Link href="/admin" className="text-2xl font-bold text-gold-500 lg:mb-6 block">
            Admin Panel
          </Link>
          <div className="hidden lg:block border-b border-gray-700 my-6"></div>
        </div>
        <div className="hidden lg:flex lg:flex-col lg:space-y-4">
          <Link href="/admin" className="hover:text-gold-400 transition-colors block py-2 px-3 rounded-lg hover:bg-gray-700">
            Dashboard
          </Link>
          <Link href="/admin/products" className="hover:text-gold-400 transition-colors block py-2 px-3 rounded-lg hover:bg-gray-700">
            Products
          </Link>
          <button
            onClick={handleLogout}
            className="hover:text-gold-400 transition-colors text-left py-2 px-3 rounded-lg hover:bg-gray-700 mt-auto"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
