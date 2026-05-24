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

type AuthorOption = {
  id: string;
  name: string;
};

const empty: PostModel = { slug: '', title: '', h1: '', chapoHtml: '', contentHtml: '', contentJson: { type: 'doc', html: '' }, faqJson: [], heroImageUrl: '', heroImageAlt: '', metaTitle: '', metaDescription: '', canonicalUrl: '', robots: 'index,follow', isActive: false, isIndexable: false, categorySlug: '', tagsJson: [], jsonLd: '', status: 'DRAFT', authorId: '' };

export function PostEditorForm({ initialPost }: { initialPost?: object }) {
  const [post, setPost] = useState<PostModel>({ ...empty, ...(initialPost ?? {}), contentJson: ((initialPost as {contentJson?: RichContentValue})?.contentJson) ?? empty.contentJson });
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

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
      setSaving(true); setError('');
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
        isActive: post.isActive,
        isIndexable: post.isIndexable,
        categorySlug: post.categorySlug || null,
        tagsJson: post.tagsJson,
        jsonLd: parsedJsonLd,
        status: post.status
      };

      if (post.id) await adminApi.put(`/admin-api/posts/${post.id}`, payload);
      else await adminApi.post('/admin-api/posts', payload);
      router.push('/admin/posts');
      router.refresh();
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Erreur sauvegarde');
    } finally { setSaving(false); }
  };

  const warning = useMemo(() => (!post.isIndexable || !post.isActive) && post.robots === 'index,follow', [post]);

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-4"><input className="w-full rounded border p-2" placeholder="Titre" value={post.title} onChange={(e)=>setPost({...post,title:e.target.value})} /><input className="w-full rounded border p-2" placeholder="H1" value={post.h1} onChange={(e)=>setPost({...post,h1:e.target.value})} /><textarea className="w-full rounded border p-2" placeholder="Chapo HTML" value={post.chapoHtml} onChange={(e)=>setPost({...post,chapoHtml:e.target.value})} /><RichContentEditor value={post.contentJson} onChange={(v)=>setPost({...post,contentJson:v,contentHtml:v.html})} /><section className="rounded border p-3"><button type="button" onClick={()=>setPost({...post,faqJson:[...post.faqJson,{question:'',answer:''}]})}>Ajouter question</button>{post.faqJson.map((faq,i)=><div key={i}><input className="w-full border p-1" value={faq.question} onChange={(e)=>setPost({...post,faqJson:post.faqJson.map((f,idx)=>idx===i?{...f,question:e.target.value}:f)})} /><textarea className="w-full border p-1" value={faq.answer} onChange={(e)=>setPost({...post,faqJson:post.faqJson.map((f,idx)=>idx===i?{...f,answer:e.target.value}:f)})} /></div>)}</section></div><aside className="space-y-3"><input className="w-full rounded border p-2" placeholder="slug" value={post.slug} onChange={(e)=>setPost({...post,slug:e.target.value})} /><label className="block text-sm">Auteur</label><select className="w-full rounded border p-2" value={post.authorId} onChange={(e)=>setPost({...post,authorId:e.target.value})}><option value="">Sélectionner un auteur</option>{authors.map((author)=><option key={author.id} value={author.id}>{author.name}</option>)}</select><input className="w-full rounded border p-2" placeholder="categorySlug" value={post.categorySlug} onChange={(e)=>setPost({...post,categorySlug:e.target.value})} /><input className="w-full rounded border p-2" placeholder="tags séparés virgules" value={post.tagsJson.join(',')} onChange={(e)=>setPost({...post,tagsJson:e.target.value.split(',').map((x)=>x.trim()).filter(Boolean)})} /><input className="w-full rounded border p-2" placeholder="heroImageUrl" value={post.heroImageUrl} onChange={(e)=>setPost({...post,heroImageUrl:e.target.value})} /><input className="w-full rounded border p-2" placeholder="heroImageAlt" value={post.heroImageAlt} onChange={(e)=>setPost({...post,heroImageAlt:e.target.value})} /><input className="w-full rounded border p-2" placeholder="metaTitle" value={post.metaTitle} onChange={(e)=>setPost({...post,metaTitle:e.target.value})} /><textarea className="w-full rounded border p-2" placeholder="metaDescription" value={post.metaDescription} onChange={(e)=>setPost({...post,metaDescription:e.target.value})} /><input className="w-full rounded border p-2" placeholder="canonicalUrl" value={post.canonicalUrl} onChange={(e)=>setPost({...post,canonicalUrl:e.target.value})} /><input className="w-full rounded border p-2" placeholder="robots" value={post.robots} onChange={(e)=>setPost({...post,robots:e.target.value})} /><textarea className="w-full rounded border p-2" placeholder="jsonLd objet/array" value={post.jsonLd} onChange={(e)=>setPost({...post,jsonLd:e.target.value})} /><label><input type="checkbox" checked={post.isActive} onChange={(e)=>setPost({...post,isActive:e.target.checked})} /> actif</label><label><input type="checkbox" checked={post.isIndexable} onChange={(e)=>setPost({...post,isIndexable:e.target.checked})} /> indexable</label><select value={post.status} onChange={(e)=>setPost({...post,status:e.target.value as 'DRAFT'|'PUBLISHED'})}><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option></select>{warning ? <p className="text-amber-500 text-sm">Avertissement: robots index,follow incohérent avec visibilité.</p> : null}{error ? <p className="text-red-500 text-sm">{error}</p> : null}<button type="button" className="rounded bg-brand-700 px-3 py-2" onClick={save} disabled={saving}>{saving?'Enregistrement...':'Enregistrer'}</button></aside></div>;
}
