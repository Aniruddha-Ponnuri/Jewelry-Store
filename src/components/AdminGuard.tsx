'use client'
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin(user))) {
      router.push('/');
    }
  }, [user, loading, router]);

  const isAdmin = (user: any) => {
    // Add your admin check logic here
    // For example, check if user email is in admin list
    const adminEmails = ['admin@jewelry.com'];
    return adminEmails.includes(user?.email);
  };

  if (loading || !user || !isAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
