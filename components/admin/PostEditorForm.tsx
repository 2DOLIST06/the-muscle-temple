'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminApiError, adminApi } from '@/lib/admin/api-client';
import { RichContentEditor, type RichContentValue } from '@/components/admin/RichContentEditor';

type FaqItem = { question: string; answer: string };

type PostModel = {
  id?: string;
  slug: string;
  title: string;
  h1: string;
  chapoHtml: string;
  contentHtml: string;
  contentJson: RichContentValue;
  faqJson: FaqItem[];
  heroImageUrl: string;
  heroImageAlt: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robots: string;
  isActive: boolean;
  isIndexable: boolean;
  categorySlug: string;
  tagsJson: string[];
  jsonLd: string;
  status: 'DRAFT' | 'PUBLISHED';
  authorId: string;
};

type InitialPost = Partial<Omit<PostModel, 'status'>> & {
  status?: 'DRAFT' | 'PUBLISHED' | 'draft' | 'published';
  author?: { id?: string | null } | null;
};

type AuthorOption = {
  id: string;
  name: string;
};

const empty: PostModel = {
  slug: '',
  title: '',
  h1: '',
  chapoHtml: '',
  contentHtml: '',
  contentJson: { type: 'doc', html: '' },
  faqJson: [],
  heroImageUrl: '',
  heroImageAlt: '',
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  robots: 'index,follow',
  isActive: false,
  isIndexable: false,
  categorySlug: '',
  tagsJson: [],
  jsonLd: '',
  status: 'DRAFT',
  authorId: ''
};

const fieldClass =
  'w-full rounded border border-slate-600 bg-white p-2 text-slate-950 placeholder:text-slate-500 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';
const labelClass = 'block text-sm font-medium text-slate-200';
const checkboxClass = 'h-4 w-4 rounded border-slate-500 bg-white text-brand-700 accent-brand-700';

const normalizeInitialPost = (initialPost?: InitialPost): PostModel => {
  const status = initialPost?.status?.toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

  return {
    ...empty,
    ...(initialPost ?? {}),
    status,
    authorId: initialPost?.authorId || initialPost?.author?.id || '',
    contentJson: initialPost?.contentJson ?? empty.contentJson,
    isActive: initialPost?.isActive ?? status === 'PUBLISHED',
    isIndexable: initialPost?.isIndexable ?? status === 'PUBLISHED'
  };
};

export function PostEditorForm({ initialPost }: { initialPost?: InitialPost }) {
  const [post, setPost] = useState<PostModel>(() => normalizeInitialPost(initialPost));
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialPost) setPost(normalizeInitialPost(initialPost));
  }, [initialPost]);

  useEffect(() => {
    async function loadOptions() {
      const response = await fetch('/admin-api/content/options', { cache: 'no-store' });
      if (!response.ok) return;
      const payload = (await response.json().catch(() => ({}))) as { authors?: Array<{ id?: string; name?: string }> };
      const normalized = payload.authors?.map((author) => ({ id: author.id ?? '', name: author.name ?? '' })).filter((author) => author.id && author.name) ?? [];
      setAuthors(normalized);
    }

    void loadOptions();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      setError('');
      const normalizedTitle = post.title.trim();
      const normalizedSlug = post.slug.trim();
      const normalizedContent = (post.contentJson.html || post.contentHtml || '').trim();
      const normalizedAuthorId = post.authorId.trim();

      if (normalizedTitle.length < 4) {
        setError('Le titre doit contenir au moins 4 caractères.');
        return;
      }
      if (normalizedContent.length < 10) {
        setError('Le contenu doit contenir au moins 10 caractères.');
        return;
      }
      if (!normalizedAuthorId) {
        setError('Veuillez sélectionner un auteur.');
        return;
      }

      let parsedJsonLd: unknown = null;
      if (post.jsonLd.trim()) parsedJsonLd = JSON.parse(post.jsonLd);
      const publishing = post.status === 'PUBLISHED';
      const payload = {
        slug: normalizedSlug || undefined,
        title: normalizedTitle,
        contentMarkdown: normalizedContent,
        authorId: normalizedAuthorId,
        h1: post.h1 || normalizedTitle,
        chapoHtml: post.chapoHtml || null,
        contentHtml: post.contentJson.html || null,
        contentJson: post.contentJson,
        faqJson: post.faqJson,
        heroImageUrl: post.heroImageUrl || null,
        heroImageAlt: post.heroImageAlt || null,
        metaTitle: post.metaTitle || null,
        metaDescription: post.metaDescription || null,
        canonicalUrl: post.canonicalUrl || null,
        robots: post.robots,
        isActive: publishing ? true : post.isActive,
        isIndexable: publishing ? true : post.isIndexable,
        categorySlug: post.categorySlug || null,
        tagsJson: post.tagsJson,
        jsonLd: parsedJsonLd,
        status: post.status,
        publishedAt: publishing ? new Date().toISOString() : null
      };

      if (post.id) await adminApi.put(`/admin-api/posts/${post.id}`, payload);
      else await adminApi.post('/admin-api/posts', payload);
      router.push('/admin/posts');
      router.refresh();
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const warning = useMemo(() => (!post.isIndexable || !post.isActive) && post.robots === 'index,follow', [post]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <input className={fieldClass} placeholder="Titre" value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} />
        <input className={fieldClass} placeholder="H1" value={post.h1} onChange={(e) => setPost({ ...post, h1: e.target.value })} />
        <textarea className={fieldClass} placeholder="Chapo HTML" value={post.chapoHtml} onChange={(e) => setPost({ ...post, chapoHtml: e.target.value })} />
        <RichContentEditor value={post.contentJson} onChange={(v) => setPost({ ...post, contentJson: v, contentHtml: v.html })} />
        <section className="rounded border border-slate-700 p-3">
          <button
            type="button"
            className="rounded border border-slate-600 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
            onClick={() => setPost({ ...post, faqJson: [...post.faqJson, { question: '', answer: '' }] })}
          >
            Ajouter question
          </button>
          <div className="mt-3 space-y-3">
            {post.faqJson.map((faq, i) => (
              <div key={i} className="space-y-2">
                <input
                  className={fieldClass}
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => setPost({ ...post, faqJson: post.faqJson.map((f, idx) => (idx === i ? { ...f, question: e.target.value } : f)) })}
                />
                <textarea
                  className={fieldClass}
                  placeholder="Réponse"
                  value={faq.answer}
                  onChange={(e) => setPost({ ...post, faqJson: post.faqJson.map((f, idx) => (idx === i ? { ...f, answer: e.target.value } : f)) })}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-3">
        <input className={fieldClass} placeholder="slug" value={post.slug} onChange={(e) => setPost({ ...post, slug: e.target.value })} />
        <label className={labelClass} htmlFor="post-author">
          Auteur
        </label>
        <select id="post-author" className={fieldClass} value={post.authorId} onChange={(e) => setPost({ ...post, authorId: e.target.value })}>
          <option value="">Sélectionner un auteur</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>
        <input className={fieldClass} placeholder="categorySlug" value={post.categorySlug} onChange={(e) => setPost({ ...post, categorySlug: e.target.value })} />
        <input
          className={fieldClass}
          placeholder="tags séparés virgules"
          value={post.tagsJson.join(',')}
          onChange={(e) => setPost({ ...post, tagsJson: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
        />
        <input className={fieldClass} placeholder="heroImageUrl" value={post.heroImageUrl} onChange={(e) => setPost({ ...post, heroImageUrl: e.target.value })} />
        <input className={fieldClass} placeholder="heroImageAlt" value={post.heroImageAlt} onChange={(e) => setPost({ ...post, heroImageAlt: e.target.value })} />
        <input className={fieldClass} placeholder="metaTitle" value={post.metaTitle} onChange={(e) => setPost({ ...post, metaTitle: e.target.value })} />
        <textarea className={fieldClass} placeholder="metaDescription" value={post.metaDescription} onChange={(e) => setPost({ ...post, metaDescription: e.target.value })} />
        <input className={fieldClass} placeholder="canonicalUrl" value={post.canonicalUrl} onChange={(e) => setPost({ ...post, canonicalUrl: e.target.value })} />
        <input className={fieldClass} placeholder="robots" value={post.robots} onChange={(e) => setPost({ ...post, robots: e.target.value })} />
        <textarea className={fieldClass} placeholder="jsonLd objet/array" value={post.jsonLd} onChange={(e) => setPost({ ...post, jsonLd: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-slate-100">
          <input className={checkboxClass} type="checkbox" checked={post.isActive} onChange={(e) => setPost({ ...post, isActive: e.target.checked })} /> actif
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-100">
          <input className={checkboxClass} type="checkbox" checked={post.isIndexable} onChange={(e) => setPost({ ...post, isIndexable: e.target.checked })} /> indexable
        </label>
        <select
          className={fieldClass}
          value={post.status}
          onChange={(e) => {
            const status = e.target.value as 'DRAFT' | 'PUBLISHED';
            setPost({ ...post, status, isActive: status === 'PUBLISHED' ? true : post.isActive, isIndexable: status === 'PUBLISHED' ? true : post.isIndexable, robots: status === 'PUBLISHED' ? 'index,follow' : post.robots });
          }}
        >
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
        </select>
        <p className="text-xs text-slate-400">Un article publié est automatiquement envoyé comme actif et indexable pour apparaître sur /articles.</p>
        {warning ? <p className="text-sm text-amber-500">Avertissement: robots index,follow incohérent avec visibilité.</p> : null}
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button type="button" className="rounded bg-brand-700 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60" onClick={save} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </aside>
    </div>
  );
}
