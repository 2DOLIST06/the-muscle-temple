'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { getArticlesPath, getNavigation, getPathLocale } from '@/lib/i18n/routing';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Container } from '@/components/ui/Container';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getPathLocale(pathname ?? '/');
  const navigation = getNavigation(locale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => setIsMenuOpen(false), [pathname]);

  const isActive = (href: string) => href === (pathname ?? '/') || (href !== '/' && href !== '/fr' && pathname?.startsWith(`${href}/`));
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;
    router.push(`${getArticlesPath(locale)}?search=${encodeURIComponent(query)}`);
    setIsMenuOpen(false);
  };

  const searchForm = (mobile = false) => (
    <form onSubmit={submitSearch} role="search" className={mobile ? 'w-full' : 'mx-auto w-full max-w-2xl'}>
      <label htmlFor={mobile ? 'mobile-article-search' : 'article-search'} className="sr-only">
        {locale === 'fr' ? 'Rechercher dans les articles' : 'Search articles'}
      </label>
      <div className="flex h-12 items-center rounded-full border border-slate-200 bg-slate-50 px-4 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-50">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input id={mobile ? 'mobile-article-search' : 'article-search'} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={locale === 'fr' ? 'Rechercher un article par mot-clé…' : 'Search articles by keyword…'} className="min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
        <button type="submit" className="rounded-full bg-brand-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-500">
          {locale === 'fr' ? 'Rechercher' : 'Search'}
        </button>
      </div>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_18px_rgba(15,23,42,0.05)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/85">
      <Container>
        <div className="flex min-h-28 items-center justify-between gap-6 py-3 lg:grid lg:grid-cols-[auto_minmax(320px,1fr)_auto]">
          <Link href={locale === 'fr' ? '/fr' : '/'} className="group flex shrink-0 items-center gap-3" aria-label={locale === 'fr' ? 'Body Training Guide — Accueil' : 'Body Training Guide — Home'}>
            <span className="relative h-24 w-24 overflow-hidden rounded-full bg-white ring-1 ring-slate-200 transition group-hover:ring-brand-500/40 lg:h-28 lg:w-28">
              <Image src="/logo-BTG.svg" alt="" fill priority sizes="(min-width: 1024px) 112px, 96px" className="object-cover" />
            </span>
            <span className="hidden sm:block">
              <span className="block text-base font-extrabold leading-tight tracking-tight text-slate-950">Body Training Guide</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                {locale === 'fr' ? 'Entraînement & nutrition' : 'Training & nutrition'}
              </span>
            </span>
          </Link>

          <div className="hidden lg:block">{searchForm()}</div>

          <div className="hidden items-center justify-end gap-3 lg:flex">
            <LanguageSwitcher />
            <Link href={getArticlesPath(locale)} className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-500 hover:shadow-md">
              {locale === 'fr' ? 'Nos articles' : 'Our articles'}
            </Link>
          </div>

          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 lg:hidden" aria-expanded={isMenuOpen} aria-controls="mobile-navigation" aria-label={isMenuOpen ? (locale === 'fr' ? 'Fermer le menu' : 'Close menu') : (locale === 'fr' ? 'Ouvrir le menu' : 'Open menu')} onClick={() => setIsMenuOpen((open) => !open)}>
            {isMenuOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>

        <div className="hidden border-t border-slate-100 py-2.5 lg:flex lg:justify-center">
          <nav className="flex items-center rounded-full bg-slate-50 p-1 text-sm font-semibold text-slate-600" aria-label={locale === 'fr' ? 'Navigation principale' : 'Main navigation'}>
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={`rounded-full px-6 py-2.5 transition ${isActive(item.href) ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200/70' : 'hover:bg-white/70 hover:text-slate-950'}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {isMenuOpen ? (
          <div id="mobile-navigation" className="border-t border-slate-100 pb-5 pt-3 lg:hidden">
            <div className="mb-4">{searchForm(true)}</div>
            <nav className="grid gap-1" aria-label={locale === 'fr' ? 'Navigation mobile' : 'Mobile navigation'}>
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive(item.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}>{item.label}</Link>
              ))}
              <Link href={getArticlesPath(locale)} className="mt-2 rounded-xl bg-brand-700 px-4 py-3 text-center text-sm font-bold text-white">{locale === 'fr' ? 'Voir tous les articles' : 'View all articles'}</Link>
            </nav>
            <div className="mt-3 flex justify-end"><LanguageSwitcher /></div>
          </div>
        ) : null}
      </Container>
    </header>
  );
}
