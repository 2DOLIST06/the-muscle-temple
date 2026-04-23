'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { posts } from '@/data/posts';
import { getStoredPosts } from '@/components/admin/post-storage';

export default function AdminPostsListPage() {
  const localPosts = getStoredPosts();

  const allPosts = useMemo(() => {
    const base = posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      updatedAt: post.updatedAt ?? post.publishedAt,
      status: 'published'
    }));

    const custom = localPosts.map((post) => ({
      slug: post.slug,
      title: post.title,
      updatedAt: post.updatedAt,
      status: post.status
    }));

    return [...custom, ...base];
  }, [localPosts]);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Articles</h1>
        <Link href="/admin/posts/new" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
          Nouvel article
        </Link>
      </div>
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
            {allPosts.map((post) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
