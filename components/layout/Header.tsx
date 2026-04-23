import Link from 'next/link';
import { mainNavigation, siteConfig } from '@/lib/constants';
import { Container } from '@/components/ui/Container';

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-bold text-slate-900">
            {siteConfig.name}
          </Link>
          <nav className="flex gap-5 text-sm font-medium text-slate-600">
            {mainNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </header>
  );
}
