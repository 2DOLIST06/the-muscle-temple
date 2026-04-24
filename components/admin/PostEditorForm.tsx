'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authors } from '@/data/authors';
import { categories } from '@/data/categories';
import type { AdminPostDraft } from '@/types/admin';
import { upsertStoredPost } from '@/components/admin/post-storage';

interface PostEditorFormProps {
  initialPost?: AdminPostDraft;
}

const createEmptyPost = (): AdminPostDraft => ({
  id: crypto.randomUUID(),
  slug: '',
  title: '',
  excerpt: '',
  description: '',
  coverImage: '',
  categorySlug: categories[0]?.slug ?? '',
  authorSlug: authors[0]?.slug ?? '',
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

export function PostEditorForm({ initialPost }: PostEditorFormProps) {
  const router = useRouter();
  const [post, setPost] = useState<AdminPostDraft>(initialPost ?? createEmptyPost());
  const [saving, setSaving] = useState(false);

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

  const handleUploadImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPost((prev) => ({ ...prev, coverImage: String(reader.result ?? '') }));
    reader.readAsDataURL(file);
  };

  const save = async (status: 'draft' | 'published') => {
    setSaving(true);
    const payload: AdminPostDraft = {
      ...post,
      status,
      slug: post.slug || slugify(post.title),
      tags: post.tags,
      updatedAt: new Date().toISOString(),
      seo: {
        ...post.seo,
        seoTitle: post.seo.seoTitle || post.title,
        seoDescription: post.seo.seoDescription || post.description
      }
    };

    upsertStoredPost(payload);
    setSaving(false);
    router.push('/admin/posts');
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
                  {category.title}
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
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              placeholder="Tags séparés par des virgules"
              value={post.tags.join(', ')}
              onChange={(e) =>
                setPost((p) => ({
                  ...p,
                  tags: e.target.value
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                }))
              }
            />
            <input
              type="date"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={post.publishedAt}
              onChange={(e) => setPost((p) => ({ ...p, publishedAt: e.target.value }))}
            />
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              placeholder="URL image de couverture"
              value={post.coverImage}
              onChange={(e) => setPost((p) => ({ ...p, coverImage: e.target.value }))}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleUploadImage(e.target.files?.[0])}
              className="text-sm text-slate-300"
            />
            {post.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.coverImage} alt="Aperçu couverture" className="mt-2 h-36 w-full rounded-lg object-cover" />
            ) : null}
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
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              placeholder="OG image URL"
              value={post.seo.ogImage}
              onChange={(e) => setPost((p) => ({ ...p, seo: { ...p.seo, ogImage: e.target.value } }))}
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
