'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PostEditorForm } from '@/components/admin/PostEditorForm';
import type { AdminPostDraft } from '@/types/admin';

interface ApiPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null;
  updatedAt: string;
  readingTimeMinutes: number;
  contentJson?: {
    sections?: Array<{ heading?: string; content?: string }>;
    faqs?: Array<{ question?: string; answer?: string }>;
  };
  seo?: {
    title?: string;
    description?: string;
    canonicalUrl?: string;
    openGraphImage?: { url?: string };
    noIndex?: boolean;
  };
  coverImage?: { url?: string };
  tags?: Array<{ slug?: string; name?: string }>;
  relatedPosts?: Array<{ slug?: string }>;
  category?: { slug: string };
  author?: { slug: string };
}

const apiToDraft = (post: ApiPost): AdminPostDraft => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt ?? '',
  description: post.seo?.description ?? '',
  categorySlug: post.category?.slug ?? '',
  authorSlug: post.author?.slug ?? '',
  readingMinutes: post.readingTimeMinutes ?? 6,
  tags: post.tags?.map((tag) => tag.slug ?? tag.name ?? '').filter(Boolean) ?? [],
  relatedPostSlugs: post.relatedPosts?.map((related) => related.slug ?? '').filter(Boolean) ?? [],
  status: post.status === 'PUBLISHED' ? 'published' : 'draft',
  publishedAt: (post.publishedAt ?? post.updatedAt).slice(0, 10),
  updatedAt: post.updatedAt,
  sections:
    post.contentJson?.sections?.map((section) => ({
      heading: section.heading ?? '',
      content: section.content ?? ''
    })) ?? [{ heading: 'Introduction', content: '' }],
  faqs:
    post.contentJson?.faqs?.map((faq) => ({
      question: faq.question ?? '',
      answer: faq.answer ?? ''
    })) ?? [],
  seo: {
    seoTitle: post.seo?.title ?? '',
    seoDescription: post.seo?.description ?? '',
    canonicalUrl: post.seo?.canonicalUrl ?? '',
    ogImage: post.seo?.openGraphImage?.url ?? '',
    noIndex: post.seo?.noIndex ?? false
  },
  coverImage: post.coverImage?.url ?? ''
});

export default function AdminEditPostPage() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<AdminPostDraft | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPost() {
      const response = await fetch('/api/admin/posts', { cache: 'no-store' });
      if (!response.ok) {
        setError('Impossible de charger cet article depuis l’API pour le moment.');
        setLoading(false);
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as { data?: ApiPost[] };
      const current = payload.data?.find((item) => item.slug === params.slug);
      setPost(current ? apiToDraft(current) : undefined);
      setLoading(false);
    }

    void loadPost();
  }, [params.slug]);

  return (
    <section>
      <h1 className="text-3xl font-bold">Modifier l&apos;article</h1>
      <p className="mt-2 text-slate-300">Édition complète avec publication et SEO.</p>
      {error ? <p className="mt-4 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">{error}</p> : null}
      <div className="mt-8">{loading ? <p>Chargement…</p> : <PostEditorForm initialPost={post} />}</div>
    </section>
  );
}
