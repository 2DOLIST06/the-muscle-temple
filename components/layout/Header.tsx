import Link from 'next/link';
import { mainNavigation, siteConfig } from '@/lib/constants';
import { Container } from '@/components/ui/Container';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
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
