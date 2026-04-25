'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAdminClientSession } from '@/lib/admin/client-session';

const links = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Articles', href: '/admin/posts' },
  { label: 'Créer un article', href: '/admin/posts/new' }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    clearAdminClientSession();
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 md:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-800 bg-slate-900 p-6">
          <p className="text-lg font-bold">Admin · The Muscle Temple</p>
          <nav className="mt-6 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm ${pathname === link.href ? 'bg-brand-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="mt-8 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Se déconnecter
          </button>
        </aside>
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
