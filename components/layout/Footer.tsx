import Link from 'next/link';
import { Container } from '@/components/ui/Container';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50 py-10">
      <Container>
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold text-slate-900">The Muscle Temple</h3>
            <p className="mt-2 text-sm text-slate-600">
              Blog musculation premium : entraînement, nutrition, récupération.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Navigation</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/articles">Articles</Link>
              </li>
              <li>
                <Link href="/about">À propos</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Newsletter</h3>
            <p className="mt-2 text-sm text-slate-600">Recevez chaque semaine nos stratégies terrain.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
