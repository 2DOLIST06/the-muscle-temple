import Link from 'next/link';
import { buildTocFromSections, type TocItem } from '@/lib/content/article-utils';
import type { PostSection } from '@/types/content';

export function TableOfContents({ slug, sections, items }: { slug: string; sections: PostSection[]; items?: TocItem[] }) {
  const tocItems = items ?? buildTocFromSections(slug, sections);
  if (tocItems.length === 0) return null;

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">Sommaire</p>
      <ul className="mt-2 space-y-2 text-sm text-slate-600">
        {tocItems.map((item) => (
          <li key={item.id} className={item.level === 3 ? 'ml-4' : undefined}>
            <Link href={`#${item.id}`} className="hover:text-slate-900">
              {item.text}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
