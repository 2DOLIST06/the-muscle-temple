import type { Metadata } from 'next'; import { AuthPage } from '@/components/user/AuthPage';
export const metadata: Metadata = { title: 'Créer un compte | Body Training Guide', robots: { index: false, follow: false } };
export default function Page() { return <AuthPage locale="fr" mode="register" />; }
