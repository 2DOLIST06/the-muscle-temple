import type { Metadata } from 'next'; import { AuthPage } from '@/components/user/AuthPage';
export const metadata: Metadata = { title: 'Log in | Body Training Guide', robots: { index: false, follow: false } };
export default function Page() { return <AuthPage locale="en" mode="login" />; }
