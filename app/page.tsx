import type { Metadata } from 'next';
import Link from 'next/link';
import { CategoryCard } from '@/components/blog/CategoryCard';
import { NewsletterCta } from '@/components/blog/NewsletterCta';
import { PostCard } from '@/components/blog/PostCard';
import { SectionHeading } from '@/components/blog/SectionHeading';
import { Container } from '@/components/ui/Container';
import { HomeHero } from '@/components/home/HomeHero';
import { withLocalizedCategoryShortCopy } from '@/lib/content/category-copy';
import { contentRepository } from '@/lib/content/repository';
import { buildMetadata } from '@/lib/seo/metadata';

const homeDescription = 'Strength training, exercise, nutrition and recovery guides to help you organize your workouts and make steady progress.';
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Body Training Guide',
  url: 'https://www.bodytrainingguide.com',
  inLanguage: 'en',
  description: 'Strength training, exercise, nutrition and recovery guides to help you organize your workouts.'
};

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Body Training Guide | Strength Training, Nutrition and Exercises',
    description: homeDescription,
    path: '/',
    canonicalUrl: 'https://www.bodytrainingguide.com',
    locale: 'en',
    hreflang: [
      { hreflang: 'en', href: 'https://www.bodytrainingguide.com' },
      { hreflang: 'fr', href: 'https://www.bodytrainingguide.com/fr' },
      { hreflang: 'x-default', href: 'https://www.bodytrainingguide.com' }
    ]
  });
}

export default async function HomePage() {
  const locale = 'en';
  const [featuredPosts, categories, recentPosts, authors] = await Promise.all([
    contentRepository.getFeaturedPostsByLocale(locale, 3),
    contentRepository.getAllCategoriesByLocale(locale),
    contentRepository.getRecentPostsByLocale(locale, 4),
    contentRepository.getAllAuthorsByLocale(locale)
  ]);
  const displayablePosts = recentPosts.length > 0 ? recentPosts : featuredPosts;
  const primaryPosts = displayablePosts.length >= 3 ? displayablePosts.slice(0, 3) : displayablePosts;
  const normalizedCategories = categories.map((category) => withLocalizedCategoryShortCopy(category, locale));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <HomeHero locale="en" />

      {primaryPosts.length > 0 ? (
        <section className="py-16 sm:py-20">
          <Container>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <SectionHeading>{displayablePosts.length >= 3 ? 'Featured articles' : 'Latest articles'}</SectionHeading>
              <Link href="/articles" className="shrink-0 text-sm font-semibold text-brand-700 underline decoration-brand-300 decoration-2 underline-offset-4 transition hover:text-brand-900 hover:decoration-brand-700">
                View all
              </Link>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {primaryPosts.map((post) => (
                <PostCard key={post.id} post={post} author={authors.find((author) => author.slug === post.authorSlug)} category={normalizedCategories.find((category) => category.slug === post.categorySlug)} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
        <Container>
          <div className="grid max-w-5xl gap-5 md:grid-cols-[0.8fr_1.2fr] md:gap-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Strength training guides built around a simple method</h2>
            <p className="text-base leading-7 text-slate-600 md:mt-1">
              Body Training Guide brings together practical articles about strength training, exercises, muscle groups, nutrition and recovery. The goal is to help you understand what to train, how to structure your workouts and how to progress without adding unnecessary complexity.
            </p>
          </div>
        </Container>
      </section>

      <section id="categories" className="py-16 sm:py-20">
        <Container>
          <SectionHeading>Categories</SectionHeading>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {normalizedCategories.map((category) => (
              <CategoryCard key={category.id} category={category} locale={locale} />
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-16 pt-4 sm:pb-24">
        <Container>
          <NewsletterCta locale="en" />
        </Container>
      </section>
    </>
  );
}
