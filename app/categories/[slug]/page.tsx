import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/ui/Container';
import { contentRepository } from '@/lib/content/repository';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateStaticParams() {
  return contentRepository.getAllCategories().map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = contentRepository.getCategoryBySlug(slug);

  if (!category) {
    return buildMetadata({
      title: 'Catégorie introuvable | The Muscle Temple',
      description: 'Catégorie indisponible.',
      path: `/categories/${slug}`,
      noIndex: true
    });
  }

  return buildMetadata({
    title: `${category.title} | Catégorie`,
    description: category.description,
    path: `/categories/${category.slug}`
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = contentRepository.getCategoryBySlug(slug);

  if (!category) notFound();

  const posts = contentRepository.getPostsByCategory(slug);

  return (
    <Container>
      <section className="py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{category.title}</h1>
        <p className="mt-2 max-w-2xl text-slate-600">{category.description}</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={contentRepository.getAuthorBySlug(post.authorSlug)}
              category={category}
            />
          ))}
        </div>
      </section>
    </Container>
  );
}
