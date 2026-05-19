'use client';

import { usePathname } from 'next/navigation';
import { SiteShell } from '@/components/layout/SiteShell';

export function AppLayoutBoundary({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  if (pathname?.startsWith('/cms')) {
    return <>{children}</>;
  }

  return <SiteShell>{children}</SiteShell>;
}
