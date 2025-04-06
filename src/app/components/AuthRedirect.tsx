'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingCompleted } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Public paths that don't require auth
    const publicPaths = ['/login', '/signup', '/'];
    
    if (!user) {
      // If not logged in and trying to access protected route, redirect to login
      if (!publicPaths.includes(pathname)) {
        router.push('/login');
      }
      return;
    }

    // User is logged in
    if (onboardingCompleted === false) {
      // If onboarding not completed, redirect to onboarding
      if (pathname !== '/onboarding') {
        router.push('/onboarding');
      }
    } else if (onboardingCompleted === true) {
      // If on login/signup pages, redirect to homepage
      if (pathname === '/login' || pathname === '/signup') {
        router.push('/');
      }
    }
  }, [user, loading, onboardingCompleted, pathname, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
} 