import type { Metadata } from 'next';
import Link from 'next/link';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/ui/Container';
import { withLocalizedCategoryShortCopy } from '@/lib/content/category-copy';
import { contentRepository } from '@/lib/content/repository';
import { buildMetadata } from '@/lib/seo/metadata';
import { getPageSeo } from '@/lib/seo/pages';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getPageSeo('articles', 'en', {
    title: 'Training and nutrition articles | Body Training Guide',
    description: 'All English articles about training, nutrition and recovery.',
    path: '/articles',
    locale: 'en',
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

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const query = (await searchParams).search?.trim() ?? '';
  const [posts, authors, categories] = await Promise.all([
    contentRepository.getAllPostsByLocale('en'),
    contentRepository.getAllAuthorsByLocale('en'),
    contentRepository.getAllCategoriesByLocale('en')
  ]);
  const keywords = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  const filteredPosts = keywords.length === 0 ? posts : posts.filter((post) => {
    const searchable = normalizeSearchText([post.title, post.excerpt, post.description, ...post.tags, ...post.sections.flatMap((section) => [section.heading, ...section.content])].join(' '));
    return keywords.every((keyword) => searchable.includes(keyword));
  });
  const normalizedCategories = categories.map((category) => withLocalizedCategoryShortCopy(category, 'en'));

  return (
    <Container>
      <section className="py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{query ? `Results for “${query}”` : 'All articles'}</h1>
            <p className="mt-2 text-slate-600">{query ? `${filteredPosts.length} article${filteredPosts.length === 1 ? '' : 's'} found.` : 'English articles loaded from the public API.'}</p>
          </div>
          <Link href="/fr/articles" className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
            Français
          </Link>
        </div>

        {normalizedCategories.length > 0 ? (
          <nav aria-label="Browse articles by category" className="mt-7 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 sm:flex sm:items-center sm:gap-4">
            <p className="text-sm font-semibold text-slate-700">Browse by category</p>
            <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
              {normalizedCategories.map((category) => (
                <Link key={category.id} href={`/categories/${category.slug}`} className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-900 hover:shadow">
                  {category.title}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}

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
            <h2 className="text-lg font-semibold text-slate-900">{query ? 'No article matches your search.' : 'No published English article available.'}</h2>
            <p className="mt-2">{query ? 'Try fewer or more general keywords.' : 'Check that the API returns PUBLISHED, active posts on /api/posts?locale=en.'}</p>
          </div>
        )}
      </section>
    </Container>
  );
}
