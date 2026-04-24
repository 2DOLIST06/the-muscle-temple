'use client';

import type { AdminPostDraft } from '@/types/admin';

const KEY = 'mt_admin_posts';

export const getStoredPosts = (): AdminPostDraft[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminPostDraft[]) : [];
  } catch {
    return [];
  }
};

export const upsertStoredPost = (post: AdminPostDraft) => {
  const existing = getStoredPosts();
  const index = existing.findIndex((item) => item.slug === post.slug || item.id === post.id);
  if (index >= 0) existing[index] = post;
  else existing.unshift(post);
  localStorage.setItem(KEY, JSON.stringify(existing));
};

export const getStoredPostBySlug = (slug: string) => getStoredPosts().find((item) => item.slug === slug);
