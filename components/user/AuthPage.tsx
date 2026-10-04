import { Suspense } from 'react';
import { AuthForm } from './AuthForm';
import { Container } from '@/components/ui/Container';

export function AuthPage({ locale, mode }: { locale: 'fr' | 'en'; mode: 'login' | 'register' }) {
  const french = locale === 'fr';
  const title = mode === 'login' ? (french ? 'Connexion' : 'Log in') : (french ? 'Créer un compte' : 'Create account');
  const intro = mode === 'login' ? (french ? 'Retrouvez votre journal et votre suivi nutritionnel.' : 'Access your food diary and nutrition tracker.') : (french ? 'Créez votre espace pour suivre votre nutrition au quotidien.' : 'Create your space to track your daily nutrition.');
  return <main className="bg-slate-50 py-12 sm:py-16"><Container><section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"><p className="text-sm font-bold uppercase tracking-widest text-brand-700">Body Training Guide</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1><p className="mt-3 leading-7 text-slate-600">{intro}</p><Suspense fallback={<p className="mt-8 text-slate-500">…</p>}><AuthForm locale={locale} mode={mode} /></Suspense></section></Container></main>;
}
