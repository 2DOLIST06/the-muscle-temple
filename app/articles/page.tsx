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

        {posts.length > 0 ? (
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
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
            <h2 className="text-lg font-semibold text-slate-900">Aucun article publié disponible.</h2>
            <p className="mt-2">
              Vérifiez que l’article est en statut PUBLISHED, actif et que l’API publique renvoie bien ce post sur /api/posts.
            </p>
          </div>
        )}
      </section>
    </Container>
  );
}
