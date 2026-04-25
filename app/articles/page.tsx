import type { Metadata } from 'next';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/ui/Container';
import { contentRepository } from '@/lib/content/repository';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Articles musculation et nutrition | The Muscle Temple',
  description: 'Tous les articles du blog : entraînement, nutrition et récupération.',
  path: '/articles'
});

export default async function ArticlesPage() {
  const [posts, authors, categories] = await Promise.all([
    contentRepository.getAllPosts(),
    contentRepository.getAllAuthors(),
    contentRepository.getAllCategories()
  ]);

  return (
    <Container>
      <section className="py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tous les articles</h1>
        <p className="mt-2 text-slate-600">Articles chargés depuis l’API publique.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={authors.find((author) => author.slug === post.authorSlug)}
              category={categories.find((category) => category.slug === post.categorySlug)}
            />
          ))}
        </div>
      </section>
    </Container>
  );
}
