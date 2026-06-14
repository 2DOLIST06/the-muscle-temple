import Link from 'next/link';
import type { PostSection } from '@/types/content';

export function TableOfContents({ slug, sections }: { slug: string; sections: PostSection[] }) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">Sommaire</p>
      <ul className="mt-2 space-y-2 text-sm text-slate-600">
        {sections.map((section) => {
          const id = `${slug}-${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          return (
            <li key={id}>
              <Link href={`#${id}`} className="hover:text-slate-900">
                {section.heading}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
