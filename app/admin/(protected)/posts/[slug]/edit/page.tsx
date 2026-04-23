'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PostEditorForm } from '@/components/admin/PostEditorForm';
import { getStoredPostBySlug } from '@/components/admin/post-storage';

export default function AdminEditPostPage() {
  const params = useParams<{ slug: string }>();
  const current = useMemo(() => getStoredPostBySlug(params.slug), [params.slug]);

  return (
    <section>
      <h1 className="text-3xl font-bold">Modifier l&apos;article</h1>
      <p className="mt-2 text-slate-300">Édition complète avec publication et SEO.</p>
      <div className="mt-8">
        <PostEditorForm initialPost={current} />
      </div>
    </section>
  );
}
