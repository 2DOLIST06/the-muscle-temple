import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { AuthorBox } from '@/components/blog/AuthorBox';
import { BlogPostSeo } from '@/components/blog/BlogPostSeo';
import { PostCard } from '@/components/blog/PostCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { contentRepository } from '@/lib/content/repository';
import { formatDate } from '@/lib/content/presenters';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await contentRepository.getPostBySlug(slug);

  if (!post) {
    return buildMetadata({
      title: 'Article introuvable | The Muscle Temple',
      description: 'Article introuvable',
      path: `/blog/${slug}`,
      noIndex: true
    });
  }

  return buildMetadata({
    title: `${post.title} | The Muscle Temple`,
    description: post.description,
    path: `/blog/${post.slug}`,
    image: post.coverImage,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    keywords: post.tags
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await contentRepository.getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [author, related] = await Promise.all([
    contentRepository.getAuthorBySlug(post.authorSlug),
    contentRepository.getRelatedPosts(post)
  ]);

  return (
    <Container>
      <article className="py-10">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.title, href: `/blog/${post.slug}` }
          ]}
        />

        <h1 className="text-4xl font-bold">{post.title}</h1>
        <p className="mt-3 text-slate-600">{post.excerpt}</p>

        <div className="mt-4 text-sm text-slate-500">
          {author?.name ?? 'Équipe éditoriale'} · {formatDate(post.publishedAt)}
        </div>

        <div className="relative mt-8 h-72 overflow-hidden rounded-2xl md:h-[420px]">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
        </div>

        <div className="mt-8 space-y-4">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              {section.content.map((paragraph) => (
                <p key={paragraph} className="mt-2 text-slate-700">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        {author ? (
          <div className="mt-8">
            <AuthorBox author={author} />
          </div>
        ) : null}

        {related.length ? (
          <section className="mt-10">
            <h2 className="text-2xl font-bold">Articles liés</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedPost) => (
                <PostCard
                  key={relatedPost.slug}
                  post={{
                    ...post,
                    ...relatedPost,
                    id: relatedPost.slug,
                    description: relatedPost.excerpt,
                    readingMinutes: 5,
                    tags: [],
                    sections: []
                  }}
                  author={author}
                />
              ))}
            </div>
          </section>
        ) : null}

        <BlogPostSeo
          post={{
            title: post.title,
            h1: post.title,
            metaDescription: post.description,
            chapoHtml: post.excerpt,
            heroImageUrl: post.coverImage,
            createdAt: post.publishedAt,
            updatedAt: post.updatedAt
          }}
          path={`/blog/${post.slug}`}
        />
      </article>
    </Container>
  );
}
