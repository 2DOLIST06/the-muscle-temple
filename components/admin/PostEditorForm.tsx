'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminPostDraft } from '@/types/admin';

interface PostEditorFormProps {
  initialPost?: AdminPostDraft;
}

interface ContentOption {
  id: string;
  name: string;
  slug: string;
}

const createEmptyPost = (): AdminPostDraft => ({
  id: '',
  slug: '',
  title: '',
  excerpt: '',
  description: '',
  coverImage: '',
  categorySlug: '',
  authorSlug: '',
  readingMinutes: 6,
  tags: [],
  status: 'draft',
  publishedAt: new Date().toISOString().slice(0, 10),
  updatedAt: new Date().toISOString(),
  sections: [{ heading: 'Introduction', content: '' }],
  seo: {
    seoTitle: '',
    seoDescription: '',
    canonicalUrl: '',
    ogImage: '',
    noIndex: false
  }
});

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const postToMarkdown = (post: AdminPostDraft) =>
  post.sections
    .map((section) => `## ${section.heading || 'Section'}\n\n${section.content}`)
    .join('\n\n')
    .trim();

export function PostEditorForm({ initialPost }: PostEditorFormProps) {
  const router = useRouter();
  const [post, setPost] = useState<AdminPostDraft>(initialPost ?? createEmptyPost());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authors, setAuthors] = useState<ContentOption[]>([]);
  const [categories, setCategories] = useState<ContentOption[]>([]);

  useEffect(() => {
    async function loadOptions() {
      const response = await fetch('/api/admin/content/options', { cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expirée. Reconnexion nécessaire.');
          router.push('/admin/login');
        }
        return;
      }

      const payload = (await response.json()) as {
        authors: Array<{ id: string; name: string; slug: string }>;
        categories: Array<{ id: string; name: string; slug: string }>;
      };

      setAuthors(payload.authors ?? []);
      setCategories(payload.categories ?? []);

      setPost((current) => {
        const next = { ...current };
        if (!next.authorSlug && payload.authors?.[0]) next.authorSlug = payload.authors[0].slug;
        if (!next.categorySlug && payload.categories?.[0]) next.categorySlug = payload.categories[0].slug;
        return next;
      });
    }

    void loadOptions();
  }, [router]);

  const seoTitle = post.seo.seoTitle || post.title;
  const seoDescription = post.seo.seoDescription || post.description;

  const preview = useMemo(
    () => ({
      title: seoTitle,
      description: seoDescription,
      url: post.seo.canonicalUrl || `https://themuscletemple.com/articles/${post.slug || 'nouvel-article'}`
    }),
    [seoDescription, seoTitle, post.seo.canonicalUrl, post.slug]
  );

  const save = async (status: 'draft' | 'published') => {
    setSaving(true);
    setError(null);

    const author = authors.find((item) => item.slug === post.authorSlug);
    const category = categories.find((item) => item.slug === post.categorySlug);

    if (!author || !category) {
      setError('Auteur/catégorie introuvable côté API. Recharge la page et réessaie.');
      setSaving(false);
      return;
    }

    const normalizedSlug = post.slug || slugify(post.title);
    const isPublished = status === 'published';
    const contentMarkdown = postToMarkdown(post);

    const payload = {
      title: post.title,
      slug: normalizedSlug,
      excerpt: post.excerpt,
      contentMarkdown,
      contentJson: {
        sections: post.sections
      },
      status: isPublished ? 'PUBLISHED' : 'DRAFT',
      publishedAt: isPublished ? new Date(post.publishedAt).toISOString() : null,
      readingTimeMinutes: post.readingMinutes,
      authorId: author.id,
      categoryId: category.id,
      coverImageId: null,
      tagIds: [],
      relatedPostIds: [],
      seo: {
        title: post.seo.seoTitle || post.title,
        description: post.seo.seoDescription || post.description,
        canonicalUrl: post.seo.canonicalUrl,
        noIndex: post.seo.noIndex
      }
    };

    const endpoint = post.id ? `/api/admin/posts/${post.id}` : '/api/admin/posts';
    const method = post.id ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 401) {
        setError('Session expirée. Reconnexion nécessaire.');
        router.push('/admin/login');
        setSaving(false);
        return;
      }

      const body = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      setError(body.message ?? body.error ?? 'Erreur API pendant la sauvegarde.');
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push('/admin/posts');
    router.refresh();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-8">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Contenu principal</h2>
          <div className="mt-5 grid gap-4">
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              placeholder="Titre de l'article"
              value={post.title}
              onChange={(e) => setPost((p) => ({ ...p, title: e.target.value, slug: p.slug || slugify(e.target.value) }))}
            />
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              placeholder="Slug"
              value={post.slug}
              onChange={(e) => setPost((p) => ({ ...p, slug: slugify(e.target.value) }))}
            />
            <textarea
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              rows={2}
              placeholder="Extrait"
              value={post.excerpt}
              onChange={(e) => setPost((p) => ({ ...p, excerpt: e.target.value }))}
            />
            <textarea
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              rows={3}
              placeholder="Description"
              value={post.description}
              onChange={(e) => setPost((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Éditeur complet (sections)</h2>
          <div className="mt-5 space-y-4">
            {post.sections.map((section, index) => (
              <div key={`${index}-${section.heading}`} className="rounded-xl border border-slate-700 p-4">
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  placeholder="Titre de section"
                  value={section.heading}
                  onChange={(e) =>
                    setPost((p) => ({
                      ...p,
                      sections: p.sections.map((item, idx) =>
                        idx === index ? { ...item, heading: e.target.value } : item
                      )
                    }))
                  }
                />
                <textarea
                  className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  rows={6}
                  placeholder="Contenu de la section"
                  value={section.content}
                  onChange={(e) =>
                    setPost((p) => ({
                      ...p,
                      sections: p.sections.map((item, idx) =>
                        idx === index ? { ...item, content: e.target.value } : item
                      )
                    }))
                  }
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPost((p) => ({ ...p, sections: [...p.sections, { heading: '', content: '' }] }))}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm"
            >
              Ajouter une section
            </button>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Publication</h2>
          <div className="mt-4 grid gap-3">
            <select
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={post.categorySlug}
              onChange={(e) => setPost((p) => ({ ...p, categorySlug: e.target.value }))}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={post.authorSlug}
              onChange={(e) => setPost((p) => ({ ...p, authorSlug: e.target.value }))}
            >
              {authors.map((author) => (
                <option key={author.id} value={author.slug}>
                  {author.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={post.readingMinutes}
              onChange={(e) => setPost((p) => ({ ...p, readingMinutes: Number(e.target.value) || 1 }))}
            />
            <input
              type="date"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={post.publishedAt}
              onChange={(e) => setPost((p) => ({ ...p, publishedAt: e.target.value }))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">SEO avancé</h2>
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              placeholder="SEO title"
              value={post.seo.seoTitle}
              onChange={(e) => setPost((p) => ({ ...p, seo: { ...p.seo, seoTitle: e.target.value } }))}
            />
            <textarea
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              rows={3}
              placeholder="SEO description"
              value={post.seo.seoDescription}
              onChange={(e) => setPost((p) => ({ ...p, seo: { ...p.seo, seoDescription: e.target.value } }))}
            />
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              placeholder="Canonical URL"
              value={post.seo.canonicalUrl}
              onChange={(e) => setPost((p) => ({ ...p, seo: { ...p.seo, canonicalUrl: e.target.value } }))}
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={post.seo.noIndex}
                onChange={(e) => setPost((p) => ({ ...p, seo: { ...p.seo, noIndex: e.target.checked } }))}
              />
              Activer noindex
            </label>
          </div>

          <div className="mt-5 rounded-lg border border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase text-slate-400">Aperçu SERP</p>
            <p className="mt-1 text-sm font-semibold text-blue-400">{preview.title || 'Titre SEO'}</p>
            <p className="text-xs text-emerald-400">{preview.url}</p>
            <p className="mt-1 text-xs text-slate-300">{preview.description || 'Description SEO'}</p>
          </div>
        </section>

        {error ? <p className="rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">{error}</p> : null}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => save('draft')}
            disabled={saving}
            className="rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold"
          >
            Sauver brouillon
          </button>
          <button
            onClick={() => save('published')}
            disabled={saving}
            className="rounded-lg bg-brand-700 px-4 py-3 text-sm font-semibold text-white"
          >
            Publier
          </button>
        </div>
      </div>
    </div>
  );
}
