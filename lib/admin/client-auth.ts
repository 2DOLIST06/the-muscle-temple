'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export async function handleAdminUnauthorized(router: AppRouterInstance, message?: string) {
  await fetch('/api/admin/logout', { method: 'POST' });
  const search = new URLSearchParams();
  search.set('reason', 'session-expired');
  if (message) search.set('message', message);
  router.push(`/admin/login?${search.toString()}`);
  router.refresh();
}
