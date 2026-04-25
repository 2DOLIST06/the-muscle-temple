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

export default function ArticlesPage() {
  const posts = contentRepository.getAllPosts();

  return (
    <Container>
      <section className="py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tous les articles</h1>
        <p className="mt-2 text-slate-600">Base prête pour brancher une pagination et des filtres connectés à une API.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={contentRepository.getAuthorBySlug(post.authorSlug)}
              category={contentRepository.getCategoryBySlug(post.categorySlug)}
            />
          ))}
        </div>
      </section>
    </Container>
  );
}
