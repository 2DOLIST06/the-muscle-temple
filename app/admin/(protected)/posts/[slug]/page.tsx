'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PostEditorForm } from '@/components/admin/PostEditorForm';
import { adminApi } from '@/lib/admin/api-client';

interface Resp { data?: Record<string, unknown> }
export default function AdminPostBySlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Record<string, unknown>>({});
  useEffect(() => { void adminApi.get<Resp>(`/admin-api/posts/${slug}`).then((r)=>setPost(r.data ?? {})).catch(()=>setPost({})); }, [slug]);
  return <section><h1 className="text-3xl font-bold">Modifier article</h1><div className="mt-6"><PostEditorForm initialPost={post} /></div></section>;
}
