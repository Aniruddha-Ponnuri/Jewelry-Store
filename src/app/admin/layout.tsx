import AdminGuard from '@/components/AdminGuard';
import AdminNavigation from '@/components/AdminNavigation';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import '@/styles/globals.css';

export const metadata = {
  title: 'Admin Dashboard - Jewelry Showcase',
  description: 'Admin panel for managing jewelry products',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AdminGuard>
            <div className="min-h-screen bg-gray-50">
              <AdminNavigation />
              <main className="lg:pl-64">
                {children}
              </main>
            </div>
          </AdminGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
