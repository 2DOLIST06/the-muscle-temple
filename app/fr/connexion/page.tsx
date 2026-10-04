import type { Metadata } from 'next'; import { AuthPage } from '@/components/user/AuthPage';
export const metadata: Metadata = { title: 'Connexion | Body Training Guide', robots: { index: false, follow: false } };
export default function Page() { return <AuthPage locale="fr" mode="login" />; }
