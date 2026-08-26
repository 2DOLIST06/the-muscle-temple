import type { Metadata } from 'next';
import Link from 'next/link';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/ui/Container';
import { contentRepository } from '@/lib/content/repository';
import { buildMetadata } from '@/lib/seo/metadata';
import { getPageSeo } from '@/lib/seo/pages';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getPageSeo('articles', 'fr', {
    title: 'Articles musculation et nutrition | Body Training Guide',
    description: 'Tous les articles français sur la musculation, la nutrition et la récupération.',
    path: '/fr/articles',
    locale: 'fr',
    hreflang: [
      { hreflang: 'en', href: 'https://www.bodytrainingguide.com/articles' },
      { hreflang: 'fr', href: 'https://www.bodytrainingguide.com/fr/articles' },
      { hreflang: 'x-default', href: 'https://www.bodytrainingguide.com/articles' }
    ]
  }));
}

interface ArticlesPageProps {
  searchParams: Promise<{ search?: string }>;
}

const normalizeSearchText = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default async function FrenchArticlesPage({ searchParams }: ArticlesPageProps) {
  const query = (await searchParams).search?.trim() ?? '';
  const [posts, authors, categories] = await Promise.all([
    contentRepository.getAllPostsByLocale('fr'),
    contentRepository.getAllAuthorsByLocale('fr'),
    contentRepository.getAllCategoriesByLocale('fr')
  ]);
  const keywords = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  const filteredPosts = keywords.length === 0 ? posts : posts.filter((post) => {
    const searchable = normalizeSearchText([post.title, post.excerpt, post.description, ...post.tags, ...post.sections.flatMap((section) => [section.heading, ...section.content])].join(' '));
    return keywords.every((keyword) => searchable.includes(keyword));
  });

  return (
    <Container>
      <section className="py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{query ? `Résultats pour « ${query} »` : 'Articles français'}</h1>
            <p className="mt-2 text-slate-600">{query ? `${filteredPosts.length} article${filteredPosts.length === 1 ? '' : 's'} trouvé${filteredPosts.length === 1 ? '' : 's'}.` : 'Articles français chargés depuis l’API publique.'}</p>
          </div>
          <Link href="/articles" className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
            English
          </Link>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
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
            <h2 className="text-lg font-semibold text-slate-900">{query ? 'Aucun article ne correspond à votre recherche.' : 'Aucun article français publié disponible.'}</h2>
            <p className="mt-2">{query ? 'Essayez avec moins de mots-clés ou des termes plus généraux.' : 'Vérifiez que l’API renvoie des articles PUBLISHED actifs sur /api/posts?locale=fr.'}</p>
          </div>
        )}
      </section>
    </Container>
  );
}
