'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearStoredPosts, getStoredPosts } from '@/components/admin/post-storage';
import type { AdminPostDraft } from '@/types/admin';

interface ApiPost {
  id: string;
  slug: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  updatedAt: string;
  publishedAt?: string | null;
}

const toLocalDraft = (post: ApiPost): AdminPostDraft => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  excerpt: '',
  description: '',
  coverImage: '',
  categorySlug: '',
  authorSlug: '',
  readingMinutes: 6,
  tags: [],
  status: post.status === 'PUBLISHED' ? 'published' : 'draft',
  publishedAt: (post.publishedAt ?? post.updatedAt).slice(0, 10),
  updatedAt: post.updatedAt,
  sections: [{ heading: 'Introduction', content: '' }],
  seo: {
    seoTitle: '',
    seoDescription: '',
    canonicalUrl: '',
    ogImage: '',
    noIndex: false
  }
});

export default function AdminPostsListPage() {
  const router = useRouter();
  const [apiPosts, setApiPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);

  const localPosts = useMemo(() => getStoredPosts(), []);

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      const response = await fetch('/api/admin/posts', { cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as {
        data?: ApiPost[];
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expirée. Reconnexion nécessaire.');
          router.push('/admin/login');
        } else {
          setError(payload.message ?? payload.error ?? 'Erreur de chargement des articles API.');
        }
        setLoading(false);
        return;
      }

      setApiPosts(payload.data ?? []);
      setLoading(false);
    }

    void loadPosts();
  }, [router]);

  const migrateLocalPosts = async () => {
    if (!localPosts.length) return;

    setMigrating(true);
    setError(null);

    for (const post of localPosts) {
      const payload = {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        contentMarkdown: post.sections.map((section) => `${section.heading}\n\n${section.content}`).join('\n\n'),
        contentJson: { sections: post.sections },
        status: post.status === 'published' ? 'PUBLISHED' : 'DRAFT',
        publishedAt: post.status === 'published' ? new Date(post.publishedAt).toISOString() : null,
        readingTimeMinutes: post.readingMinutes,
        seo: {
          title: post.seo.seoTitle || post.title,
          description: post.seo.seoDescription || post.description,
          canonicalUrl: post.seo.canonicalUrl,
          noIndex: post.seo.noIndex
        }
      };

      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expirée pendant la migration. Merci de te reconnecter.');
          router.push('/admin/login');
        } else {
          setError(`Migration interrompue sur l'article "${post.title}".`);
        }
        setMigrating(false);
        return;
      }
    }

    clearStoredPosts();
    setMigrating(false);
    window.location.reload();
  };

  const allPosts = useMemo(() => apiPosts.map(toLocalDraft), [apiPosts]);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Articles</h1>
        <Link href="/admin/posts/new" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
          Nouvel article
        </Link>
      </div>

      {localPosts.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-700 bg-amber-950/40 p-4 text-sm text-amber-200">
          <p>{localPosts.length} article(s) encore en localStorage. Migration recommandée vers l&apos;API.</p>
          <button
            onClick={migrateLocalPosts}
            disabled={migrating}
            className="mt-3 rounded-lg border border-amber-500 px-3 py-2 font-semibold"
          >
            {migrating ? 'Migration en cours…' : 'Migrer vers la base'}
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-4 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">{error}</p> : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Dernière mise à jour</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="border-t border-slate-800">
                <td className="px-4 py-3" colSpan={4}>
                  Chargement des articles API…
                </td>
              </tr>
            ) : (
              allPosts.map((post) => (
                <tr key={`${post.slug}-${post.updatedAt}`} className="border-t border-slate-800">
                  <td className="px-4 py-3">{post.title}</td>
                  <td className="px-4 py-3 capitalize">{post.status}</td>
                  <td className="px-4 py-3">{new Date(post.updatedAt).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/posts/${post.slug}/edit`} className="text-brand-400 hover:text-brand-300">
                      Éditer
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
