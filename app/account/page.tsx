import { Suspense } from 'react';
import { AccountPage } from '@/components/user/AccountPage';
export const metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function Page() { return <Suspense fallback={<p>Loading…</p>}><AccountPage locale="en" /></Suspense>; }
