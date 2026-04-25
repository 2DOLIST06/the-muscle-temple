import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/ui/Container';
import { contentRepository } from '@/lib/content/repository';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateStaticParams() {
  const authors = await contentRepository.getAllAuthors();
  return authors.map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const author = await contentRepository.getAuthorBySlug(slug);

  if (!author) {
    return buildMetadata({
      title: 'Auteur introuvable | The Muscle Temple',
      description: 'Auteur indisponible.',
      path: `/authors/${slug}`,
      noIndex: true
    });
  }

  return buildMetadata({
    title: `${author.name} | Auteur`,
    description: author.bio,
    path: `/authors/${author.slug}`
  });
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = await contentRepository.getAuthorBySlug(slug);

  if (!author) notFound();

  const [posts, categories] = await Promise.all([
    contentRepository.getPostsByAuthor(slug),
    contentRepository.getAllCategories()
  ]);

  return (
    <Container>
      <section className="py-12">
        <div className="flex items-center gap-4">
          <Image src={author.avatar} alt={author.name} width={72} height={72} className="rounded-full object-cover" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{author.name}</h1>
            <p className="text-slate-600">{author.role}</p>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-slate-700">{author.bio}</p>

        <h2 className="mt-10 text-xl font-semibold">Articles de cet auteur</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={author}
              category={categories.find((category) => category.slug === post.categorySlug)}
            />
          ))}
        </div>
      </section>
    </Container>
  );
}
