'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Check if running in browser and allow hydration
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        setHasHydrated(true);
      }, 100); // Small delay to ensure Zustand has hydrated
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Only redirect after hydration and if not authenticated
    if (hasHydrated && (!isAuthenticated || !user)) {
      console.log('ProtectedRoute: Redirecting to login', { isAuthenticated, hasUser: !!user });
      router.push('/auth/login');
    }
  }, [isAuthenticated, user, router, hasHydrated]);

  // Show loading while hydrating
  if (!hasHydrated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading if not authenticated after hydration
  if (!isAuthenticated || !user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}