'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTenantFeatures } from '@/hooks/useTenantFeatures';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { needsOnboarding, loading } = useTenantFeatures();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && needsOnboarding && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [loading, needsOnboarding, pathname, router]);

  // If loading, we might want to show a spinner, but usually the children will handle their own loading states
  // or the layout will show.
  return <>{children}</>;
}
