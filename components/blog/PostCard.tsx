import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/content/presenters';
import { Badge } from '@/components/ui/Badge';
import type { Author, Category, Post } from '@/types/content';

interface PostCardProps {
  post: Post;
  category?: Category;
  author?: Author;
}

export function PostCard({ post, category, author }: PostCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Link href={`/blog/${post.slug}`}>
        <div className="relative h-52 w-full">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
        </div>
      </Link>
      <div className="p-5">
        {category ? <Badge>{category.title}</Badge> : null}
        <h3 className="mt-3 text-lg font-semibold text-slate-900">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
        <div className="mt-4 text-xs text-slate-500">
          <span>{author?.name ?? 'Équipe éditoriale'}</span> · <span>{formatDate(post.publishedAt)}</span> ·{' '}
          <span>{post.readingMinutes} min</span>
        </div>
      </div>
    </article>
  );
}
