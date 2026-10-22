'use client';

import { SiteShell } from '@/components/layout/SiteShell';
import { ConsentProvider } from '@/components/consent/ConsentProvider';

export function AppLayoutBoundary({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ConsentProvider><SiteShell>{children}</SiteShell></ConsentProvider>;
}
