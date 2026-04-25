'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminPostDraft } from '@/types/admin';

interface PostEditorFormProps {
  initialPost?: AdminPostDraft;
}

interface ContentOption {
  id: string;
  name: string;
  slug?: string;
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
  faqs: [],
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

const buildFaqJsonLd = (faqs: AdminPostDraft['faqs']) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs
    .filter((faq) => faq.question.trim() && faq.answer.trim())
    .map((faq) => ({
      '@type': 'Question',
      name: faq.question.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer.trim()
      }
    }))
});

function RichTextEditor({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const applyCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML ?? '');
  };

  return (
    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950">
      <div className="flex flex-wrap gap-2 border-b border-slate-700 p-2 text-xs">
        <select
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
          defaultValue="P"
          onChange={(e) => applyCommand('formatBlock', e.target.value)}
        >
          <option value="P">Paragraphe</option>
          <option value="H1">H1</option>
          <option value="H2">H2</option>
          <option value="H3">H3</option>
          <option value="H4">H4</option>
          <option value="H5">H5</option>
          <option value="H6">H6</option>
        </select>
        <select
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
          defaultValue="Arial"
          onChange={(e) => applyCommand('fontName', e.target.value)}
        >
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Tahoma">Tahoma</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
        </select>
        <select
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
          defaultValue="3"
          onChange={(e) => applyCommand('fontSize', e.target.value)}
        >
          <option value="1">Très petit</option>
          <option value="2">Petit</option>
          <option value="3">Normal</option>
          <option value="4">Grand</option>
          <option value="5">Très grand</option>
          <option value="6">XL</option>
          <option value="7">XXL</option>
        </select>
        <button type="button" className="rounded border border-slate-700 px-2 py-1" onClick={() => applyCommand('bold')}>
          Gras
        </button>
        <button type="button" className="rounded border border-slate-700 px-2 py-1" onClick={() => applyCommand('italic')}>
          Italique
        </button>
        <button type="button" className="rounded border border-slate-700 px-2 py-1" onClick={() => applyCommand('underline')}>
          Souligné
        </button>
        <button
          type="button"
          className="rounded border border-slate-700 px-2 py-1"
          onClick={() => applyCommand('insertUnorderedList')}
        >
          Liste
        </button>
        <button
          type="button"
          className="rounded border border-slate-700 px-2 py-1"
          onClick={() => applyCommand('insertOrderedList')}
        >
          Liste num.
        </button>
        <button type="button" className="rounded border border-slate-700 px-2 py-1" onClick={() => applyCommand('formatBlock', 'BLOCKQUOTE')}>
          Citation
        </button>
        <button
          type="button"
          className="rounded border border-slate-700 px-2 py-1"
          onClick={() => {
            const url = window.prompt('URL du lien');
            if (url) applyCommand('createLink', url);
          }}
        >
          Lien
        </button>
        <button
          type="button"
          className="rounded border border-slate-700 px-2 py-1"
          onClick={() => {
            const url = window.prompt('URL de l\'image');
            if (url) applyCommand('insertImage', url);
          }}
        >
          Image
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-56 p-3 text-sm leading-7 outline-none"
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}

export function PostEditorForm({ initialPost }: PostEditorFormProps) {
  const router = useRouter();
  const [post, setPost] = useState<AdminPostDraft>(initialPost ?? createEmptyPost());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authors, setAuthors] = useState<ContentOption[]>([]);
  const [categories, setCategories] = useState<ContentOption[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  useEffect(() => {
    async function loadOptions() {
      const response = await fetch('/api/admin/content/options', { cache: 'no-store' });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? 'Impossible de charger auteurs/catégories.');
        return;
      }

      const payload = (await response.json()) as {
        authors: Array<{ id: string; name: string; slug: string }>;
        categories: Array<{ id: string; name: string; slug: string }>;
      };

      const normalizedAuthors = (payload.authors ?? []).map((author) => ({
        id: author.id,
        name: author.name ?? 'Auteur',
        slug: author.slug ?? ''
      }));
      const normalizedCategories = (payload.categories ?? []).map((category) => ({
        id: category.id,
        name: category.name ?? 'Catégorie',
        slug: category.slug ?? ''
      }));

      setAuthors(normalizedAuthors);
      setCategories(normalizedCategories);
      setSelectedAuthorId((current) => current || normalizedAuthors[0]?.id || '');
      setSelectedCategoryId((current) => current || normalizedCategories[0]?.id || '');

      setPost((current) => {
        const next = { ...current };
        if (!next.authorSlug && normalizedAuthors[0]?.slug) next.authorSlug = normalizedAuthors[0].slug;
        if (!next.categorySlug && normalizedCategories[0]?.slug) next.categorySlug = normalizedCategories[0].slug;
        return next;
      });
    }

    void loadOptions();
  }, []);

  const seoTitle = post.seo.seoTitle || post.title;
  const seoDescription = post.seo.seoDescription || post.description;
  const faqJsonLdPreview = useMemo(() => JSON.stringify(buildFaqJsonLd(post.faqs), null, 2), [post.faqs]);

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

    const authorById = authors.find((item) => item.id === selectedAuthorId);
    const categoryById = categories.find((item) => item.id === selectedCategoryId);
    const author = authorById ?? authors.find((item) => item.slug === post.authorSlug) ?? authors[0];
    const category = categoryById ?? categories.find((item) => item.slug === post.categorySlug) ?? categories[0];

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
        sections: post.sections,
        faqs: post.faqs,
        faqJsonLd: buildFaqJsonLd(post.faqs)
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
          <h2 className="text-xl font-semibold">Éditeur enrichi (HTML)</h2>
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
                <RichTextEditor
                  value={section.content}
                  onChange={(next) =>
                    setPost((p) => ({
                      ...p,
                      sections: p.sections.map((item, idx) => (idx === index ? { ...item, content: next } : item))
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

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Module FAQ</h2>
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm"
              onClick={() => setPost((p) => ({ ...p, faqs: [...p.faqs, { question: '', answer: '' }] }))}
            >
              Ajouter une question
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {post.faqs.length === 0 ? <p className="text-sm text-slate-400">Aucune question pour le moment.</p> : null}
            {post.faqs.map((faq, index) => (
              <div key={`${faq.question}-${index}`} className="rounded-xl border border-slate-700 p-4">
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) =>
                    setPost((p) => ({
                      ...p,
                      faqs: p.faqs.map((item, idx) => (idx === index ? { ...item, question: e.target.value } : item))
                    }))
                  }
                />
                <textarea
                  className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                  rows={4}
                  placeholder="Réponse"
                  value={faq.answer}
                  onChange={(e) =>
                    setPost((p) => ({
                      ...p,
                      faqs: p.faqs.map((item, idx) => (idx === index ? { ...item, answer: e.target.value } : item))
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase text-slate-400">JSON-LD FAQ généré</p>
            <pre className="mt-3 overflow-x-auto text-xs text-slate-300">{faqJsonLdPreview}</pre>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Publication</h2>
          <div className="mt-4 grid gap-3">
            <select
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={selectedAuthorId}
              onChange={(e) => setSelectedAuthorId(e.target.value)}
            >
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
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
