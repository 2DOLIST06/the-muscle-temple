import Link from 'next/link';
import { getCategoryPath, type Locale } from '@/lib/i18n/routing';
import type { Category } from '@/types/content';

export function CategoryCard({ category, locale = 'en' }: { category: Category; locale?: Locale }) {
  return (
    <Link
      href={getCategoryPath(locale, category.slug)}
      className="group block rounded-2xl border-2 border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg font-black text-brand-700">{category.title.charAt(0)}</span><span className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-700" aria-hidden="true">→</span></div>
      <h3 className="mt-5 font-semibold text-slate-900">{category.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{category.description}</p>
    </Link>
  );
}
