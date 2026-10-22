import { AccountPage } from '@/components/user/AccountPage';
export const metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function Page() { return <AccountPage locale="en" />; }
