import Link from 'next/link';
import { CategoryCard } from '@/components/blog/CategoryCard';
import { NewsletterCta } from '@/components/blog/NewsletterCta';
import { PostCard } from '@/components/blog/PostCard';
import { SectionHeading } from '@/components/blog/SectionHeading';
import { Container } from '@/components/ui/Container';
import { contentRepository } from '@/lib/content/repository';

export default function HomePage() {
  const featuredPosts = contentRepository.getFeaturedPosts(3);
  const categories = contentRepository.getAllCategories();
  const recentPosts = contentRepository.getRecentPosts(4);
  const latestPost = recentPosts[0];

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">The Muscle Temple</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Construisez un physique fort avec une méthode claire.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-600">
            Un blog dédié à la musculation, la nutrition et la récupération pour progresser durablement avec des
            stratégies applicables dès cette semaine.
          </p>
          <div className="mt-8">
            <Link href="/articles" className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
              Voir tous les articles
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <SectionHeading>Articles mis en avant</SectionHeading>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={contentRepository.getAuthorBySlug(post.authorSlug)}
                category={contentRepository.getCategoryBySlug(post.categorySlug)}
              />
            ))}
          </div>
        </Container>
      </section>

      <section id="categories" className="py-14">
        <Container>
          <SectionHeading>Catégories</SectionHeading>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </Container>
      </section>

      {latestPost ? (
        <section className="py-14">
          <Container>
            <SectionHeading>Dernier article publié</SectionHeading>
            <div className="mt-6">
              <PostCard
                post={latestPost}
                author={contentRepository.getAuthorBySlug(latestPost.authorSlug)}
                category={contentRepository.getCategoryBySlug(latestPost.categorySlug)}
              />
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
