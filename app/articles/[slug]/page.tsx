import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { AuthorBox } from '@/components/blog/AuthorBox';
import { PostCard } from '@/components/blog/PostCard';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { formatDate } from '@/lib/content/presenters';
import { contentRepository } from '@/lib/content/repository';
import { buildMetadata } from '@/lib/seo/metadata';
import { blogPostingJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';

export async function generateStaticParams() {
  const posts = await contentRepository.getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await contentRepository.getPostBySlug(slug);

  if (!post) {
    return buildMetadata({
      title: 'Article introuvable | The Muscle Temple',
      description: "L'article demandé est introuvable.",
      path: `/articles/${slug}`,
      noIndex: true
    });
  }

  return buildMetadata({
    title: `${post.title} | The Muscle Temple`,
    description: post.description,
    path: `/articles/${post.slug}`,
    image: post.coverImage,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    keywords: post.tags
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await contentRepository.getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [author, category, relatedPosts] = await Promise.all([
    contentRepository.getAuthorBySlug(post.authorSlug),
    contentRepository.getCategoryBySlug(post.categorySlug),
    contentRepository.getRelatedPosts(post, 3)
  ]);

  const postJsonLd = blogPostingJsonLd({
    title: post.title,
    description: post.description,
    slug: post.slug,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    authorName: author?.name ?? 'The Muscle Temple',
    category: category?.title ?? 'Musculation'
  });

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Accueil', path: '/' },
    { name: 'Articles', path: '/articles' },
    { name: post.title, path: `/articles/${post.slug}` }
  ]);

  return (
    <Container>
      <article className="py-10">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Articles', href: '/articles' },
            { label: post.title, href: `/articles/${post.slug}` }
          ]}
        />

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-900">{post.title}</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">{post.description}</p>

        <div className="mt-5 text-sm text-slate-500">
          <span>{author?.name}</span> · <span>{formatDate(post.publishedAt)}</span> ·{' '}
          <span>{post.readingMinutes} min de lecture</span>
        </div>

        <div className="relative mt-8 h-72 overflow-hidden rounded-2xl md:h-[420px]">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-8">
            {post.sections.map((section) => {
              const id = `${post.slug}-${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
              return (
                <section key={section.heading} id={id}>
                  <h2 className="text-2xl font-semibold text-slate-900">{section.heading}</h2>
                  <div className="mt-3 space-y-4 leading-8 text-slate-700">
                    {section.content.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              );
            })}
            {author ? <AuthorBox author={author} /> : null}
          </div>
          <div className="lg:sticky lg:top-8 lg:self-start">
            <TableOfContents slug={post.slug} sections={post.sections} />
          </div>
        </div>

        {relatedPosts.length > 0 ? (
          <section className="mt-14 border-t border-slate-200 pt-10">
            <h2 className="text-2xl font-bold">Articles liés</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <PostCard
                  key={relatedPost.slug}
                  post={{
                    ...post,
                    ...relatedPost,
                    id: relatedPost.slug,
                    categorySlug: post.categorySlug,
                    authorSlug: post.authorSlug,
                    readingMinutes: 5,
                    description: relatedPost.excerpt,
                    tags: [],
                    sections: []
                  }}
                  category={category}
                  author={author}
                />
              ))}
            </div>
          </section>
        ) : null}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      </article>
    </Container>
  );
}
