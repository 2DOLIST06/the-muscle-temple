import type { Metadata } from 'next';
import Link from 'next/link';
import { CategoryCard } from '@/components/blog/CategoryCard';
import { NewsletterCta } from '@/components/blog/NewsletterCta';
import { PostCard } from '@/components/blog/PostCard';
import { SectionHeading } from '@/components/blog/SectionHeading';
import { Container } from '@/components/ui/Container';
import { contentRepository } from '@/lib/content/repository';
import { buildMetadata } from '@/lib/seo/metadata';
import { getPageSeo } from '@/lib/seo/pages';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getPageSeo('home', 'fr', {
    title: 'Body Training Guide | Guides musculation',
    description: 'Guides de musculation, nutrition et récupération pour progresser durablement.',
    path: '/fr',
    locale: 'fr',
    hreflang: [
      { hreflang: 'en', href: 'https://bodytrainingguide.com/' },
      { hreflang: 'fr', href: 'https://bodytrainingguide.com/fr' },
      { hreflang: 'x-default', href: 'https://bodytrainingguide.com/' }
    ]
  }));
}

export default async function FrenchHomePage() {
  const locale = 'fr';
  const [featuredPosts, categories, recentPosts, authors] = await Promise.all([
    contentRepository.getFeaturedPostsByLocale(locale, 3),
    contentRepository.getAllCategoriesByLocale(locale),
    contentRepository.getRecentPostsByLocale(locale, 4),
    contentRepository.getAllAuthorsByLocale(locale)
  ]);
  const latestPost = recentPosts[0];

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Body Training Guide</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Construisez un physique fort avec une méthode claire.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-600">
            Retrouvez uniquement les contenus français disponibles : entraînement, nutrition et récupération sans fausse traduction.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/fr/articles" className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
              Voir les articles français
            </Link>
            <Link href="/" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">
              English
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <SectionHeading>Articles à la une</SectionHeading>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post) => (
              <PostCard key={post.id} post={post} author={authors.find((author) => author.slug === post.authorSlug)} category={categories.find((category) => category.slug === post.categorySlug)} />
            ))}
          </div>
        </Container>
      </section>

      <section id="categories" className="py-14">
        <Container>
          <SectionHeading>Catégories</SectionHeading>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} locale={locale} />
            ))}
          </div>
        </Container>
      </section>

      {latestPost ? (
        <section className="py-14">
          <Container>
            <SectionHeading>Dernier article</SectionHeading>
            <div className="mt-6">
              <PostCard post={latestPost} author={authors.find((author) => author.slug === latestPost.authorSlug)} category={categories.find((category) => category.slug === latestPost.categorySlug)} />
            </div>
          </Container>
        </section>
      ) : null}

      <section className="py-14">
        <Container>
          <NewsletterCta />
        </Container>
      </section>
    </>
  );
}
