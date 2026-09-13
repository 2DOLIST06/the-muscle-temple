'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export function SiteShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isProtectedAdminPage = pathname?.startsWith('/admin') && pathname !== '/admin/login';
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  useEffect(() => {
    setIsHeaderHidden(window.localStorage.getItem('admin-header-hidden') === 'true');
  }, []);

  const toggleHeader = () => {
    setIsHeaderHidden((hidden) => {
      const nextValue = !hidden;
      window.localStorage.setItem('admin-header-hidden', String(nextValue));
      return nextValue;
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      {!isProtectedAdminPage || !isHeaderHidden ? <Header /> : null}
      {isProtectedAdminPage ? (
        <button
          type="button"
          onClick={toggleHeader}
          className="fixed right-3 top-3 z-[60] inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-950/95 px-3 py-2 text-xs font-bold text-white shadow-lg transition hover:border-brand-500 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          aria-pressed={isHeaderHidden}
          aria-label={isHeaderHidden ? "Afficher l’en-tête du site" : "Masquer l’en-tête du site"}
          title={isHeaderHidden ? "Afficher l’en-tête" : "Masquer l’en-tête"}
        >
          {isHeaderHidden ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m4 15 8-8 8 8" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m4 9 8 8 8-8" />
            </svg>
          )}
          <span className={isHeaderHidden ? 'sr-only sm:not-sr-only' : 'hidden xl:inline'}>
            {isHeaderHidden ? "Afficher l’en-tête" : "Masquer l’en-tête"}
          </span>
        </button>
      ) : null}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
